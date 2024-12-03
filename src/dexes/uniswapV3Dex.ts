import { BaseDex } from "./baseDex.js";
import { DexPoolSubgraph } from "../subgraphs/dexPoolSubgraph.js";
import { UniswapV3Swap } from "../swaps/uniswapV3Swap.js";
import { Token, Opportunity } from "../types.js";
import { logger, isPriceImpactSignificant } from "../common.js";
import { PoolContract } from "../contracts/poolContract.js";
import { AflabContract } from "../contracts/aflabContract.js";
import abi from "../abis/uniswapV3PoolAbi.js";

import { Wallet, Alchemy } from "alchemy-sdk";
import { Decimal } from "decimal.js";

/**
 * Represents the Uniswap V3 DEX.
 */
class UniswapV3Dex extends BaseDex {
  /**
   * @param alchemy The Alchemy SDK instance
   * @param wallet The wallet instance
   * @param subgraph The DEX pool subgraph instance
   * @param aflabContract The AFLAB contract instance
   * @param networkId The network ID
   */
  constructor(
    alchemy: Alchemy,
    wallet: Wallet,
    subgraph: DexPoolSubgraph,
    aflabContract: AflabContract,
    networkId: number
  ) {
    super(alchemy, wallet, subgraph, aflabContract, networkId);
  }

  async processSwap(swap: UniswapV3Swap, lastPoolSqrtPriceX96: bigint) {
    let contract: PoolContract | undefined;

    if (lastPoolSqrtPriceX96 <= 0) {
      logger.warn(
        `Invalid lastPoolSqrtPriceX96: ${lastPoolSqrtPriceX96}`,
        this.constructor.name
      );
      return;
    }

    try {
      contract = this.getContract(swap.getContractAddress());
    } catch (error) {
      logger.warn(`Error fetching contract: ${error}`, this.constructor.name);
      return;
    }

    const inputTokens: Token[] = contract.getInputTokens();

    swap.setTokens(inputTokens);

    let tokenA, tokenC: Token;

    [tokenA, tokenC] =
      swap.amount0 > 0
        ? [inputTokens[0], inputTokens[1]]
        : [inputTokens[1], inputTokens[0]];

    const swapName = `${tokenA.symbol} -> ${tokenC.symbol}`;
    const [swapInputAmount, swapOutAmount] =
      swap.amount0 > 0
        ? [swap.amount0, swap.amount1]
        : [swap.amount1, swap.amount0];
    logger.debug(
      `Processing swap: ${swapName}, amountA=${swapInputAmount}, amountC=${swapOutAmount}`,
      this.constructor.name
    );

    const opportunity: Opportunity = {
      tokenAIn: new Decimal(swapInputAmount.toString()).div(10), // Divide by 10 to avoid overflow
      lastPoolSqrtPriceX96: new Decimal(lastPoolSqrtPriceX96.toString()),
      originalSwap: swap,
      expectedProfit: undefined, // To be calculated
      originalSwapPriceImpact: undefined,
      arbitInfo: {
        swap1: undefined,
        swap2: undefined,
        swap3: undefined,
        estimatedGasCost: new Decimal(0),
      },
    };

    try {
      opportunity.originalSwapPriceImpact = swap.calculatePriceImpact(
        opportunity.lastPoolSqrtPriceX96,
        tokenA.decimals,
        tokenC.decimals
      );
    } catch (error) {
      logger.warn(
        `Error calculating price impact: ${error}`,
        this.constructor.name
      );
      return;
    }

    logger.debug(
      `Calculated price impact of ${opportunity.originalSwapPriceImpact} (bps) for swap: ${swapName}`,
      this.constructor.name
    );

    if (isPriceImpactSignificant(opportunity.originalSwapPriceImpact!)) {
      logger.info(
        `Significant price impact (${opportunity.originalSwapPriceImpact}) detected for swap: ${swapName}`,
        this.constructor.name
      );

      const candidateTokenBs: Token[] = this.findIntermediaryTokens(
        tokenA.symbol,
        tokenC.symbol
      );

      if (candidateTokenBs.length === 0) {
        logger.info(
          `No candidates for token B found for opportunity.`,
          this.constructor.name
        );
        return;
      }

      logger.info(
        `Found ${candidateTokenBs.length} candidate token Bs`,
        this.constructor.name
      );

      let tokenBData;
      try {
        tokenBData = this.pickTokenB(
          tokenA,
          tokenC,
          candidateTokenBs,
          opportunity.tokenAIn,
          contract
        );
      } catch (error) {
        logger.debug(`Unable to pick token B: ${error}`, this.constructor.name);
        logger.info(
          `No profitable arbitrage opportunities found for swap: ${swapName}`,
          this.constructor.name
        );
        return;
      }

      opportunity.expectedProfit = tokenBData.expectedProfitData.expectedProfit;
      opportunity.arbitInfo.swap1 = {
        tokenIn: tokenA,
        tokenOut: tokenBData.tokenB,
        poolFee: tokenBData.expectedProfitData.swap1FeeDecimal,
        amountOutMinimum: new Decimal(0),
      };
      opportunity.arbitInfo.swap2 = {
        tokenIn: tokenBData.tokenB,
        tokenOut: tokenC,
        poolFee: tokenBData.expectedProfitData.swap2FeeDecimal,
        amountOutMinimum: new Decimal(0),
      };
      opportunity.arbitInfo.swap3 = {
        tokenIn: tokenC,
        tokenOut: tokenA,
        poolFee: tokenBData.expectedProfitData.swap3FeeDecimal,
        amountOutMinimum: new Decimal(0),
      };

      try {
        this.logOpportunity(opportunity);
      } catch (error) {
        logger.warn(`Invalid opportunity: ${error}`, this.constructor.name);
        return;
      }

      try {
        // Trigger smart contract execution
        await this.triggerSmartContract(opportunity);
      } catch (error) {
        logger.warn(
          `Error triggering smart contract: ${error}`,
          this.constructor.name
        );
        return;
      }
    }
  }

  /**
   * Initialize the DEX.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn("Already initialized", this.constructor.name);
      return;
    }

    try {
      this.aflabContract.initialize();
    } catch (error) {
      logger.error(
        `Error initializing AFLAB contract: ${error}`,
        this.constructor.name
      );
      throw error;
    }

    try {
      this.subgraph.initialize();
    } catch (error) {
      logger.error(
        `Error initializing subgraph: ${error}`,
        this.constructor.name
      );
      throw error;
    }

    try {
      this.pools = await this.subgraph.getPools();
    } catch (error) {
      logger.error(`Error fetching pools: ${error}`, this.constructor.name);
      throw error;
    }
    logger.info(`Fetched ${this.pools.length} pools`, this.constructor.name);

    let poolCount = 0;
    for (const pool of this.pools) {
      logger.debug(`Creating pool # ${++poolCount}`, this.constructor.name);

      // Create and store a PoolContract instance for each pool
      const poolContract = new PoolContract(
        pool.id,
        this.alchemy,
        abi,
        pool,
        this.processSwap.bind(this),
        this.network
      );
      this.contractsMap.set(pool.id, poolContract);

      // Initialize the contract instance
      try {
        poolContract.initialize();
      } catch (error) {
        logger.error(
          `Error initializing pool contract: ${error}`,
          this.constructor.name
        );
        throw error;
      }
      logger.info(
        `Initialized pool for contract: ${pool.id}`,
        this.constructor.name
      );

      // For each token in the pool, add the pool to the inputTokenSymbolIndex
      for (const token of pool.inputTokens) {
        if (!this.inputTokenSymbolIndex.has(token.symbol)) {
          this.inputTokenSymbolIndex.set(token.symbol, []);
        }
        this.inputTokenSymbolIndex.get(token.symbol)!.push(pool);
      }
    }

    this.initialized = true;
    logger.info("Initialized Dex", this.constructor.name);
  }
}

export { UniswapV3Dex };