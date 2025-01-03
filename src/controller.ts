import { BaseDex } from "./dexes/baseDex.js";
import { UniswapV3Dex } from "./dexes/uniswapV3Dex.js";
import { DexPoolSubgraph } from "./subgraphs/dexPoolSubgraph.js";
import { config, getTGUrl, logger } from "./common.js";
import { AflabContract } from "./contracts/aflabContract.js";
import { LendingPoolAPContract } from "./contracts/lendingPoolAPContract.js";
import { Alchemy, Network, TransactionRequest, TransactionResponse, Wallet } from "alchemy-sdk";
import { TxHandler } from "./txHandler.js";

class Controller {
    private readonly walletPrivateKey: string;
    private readonly aflabContractAddress: string;
    private readonly alchemy: Alchemy;
    private readonly theGraphBaseUrl: string;
    private readonly theGraphApiKey: string;
    private readonly uniswapV3SubgraphName: string;
    private readonly aavePoolAddressProviderContractAddress: string;
    private dexes?: BaseDex[];
    private wallet?: Wallet;

    /**
     * @param walletPrivateKey - The private key of the wallet.
     * @param aflabContractAddress - The address of the Aflab contract.
     * @param theGraphBaseUrl - The base URL for The Graph API.
     * @param theGraphApiKey - The API key for The Graph.
     * @param uniswapV3SubgraphName - The name of the Uniswap V3 subgraph.
     * @param alchemyApiKey - The API key for Alchemy.
     * @param aavePoolAddressProviderContractAddress - The address of the Aave Pool Address Provider contract.
     *
     * @throws Will throw an error if initialization fails.
     */
    constructor(
        walletPrivateKey: string,
        aflabContractAddress: string,
        theGraphBaseUrl: string,
        theGraphApiKey: string,
        uniswapV3SubgraphName: string,
        alchemyApiKey: string,
        aavePoolAddressProviderContractAddress: string,
    ) {
        try {
            this.walletPrivateKey = walletPrivateKey;
            this.theGraphBaseUrl = theGraphBaseUrl;
            this.theGraphApiKey = theGraphApiKey;
            this.uniswapV3SubgraphName = uniswapV3SubgraphName;
            this.alchemy = new Alchemy({
                apiKey: alchemyApiKey,
                network: Network.MATIC_MAINNET,
                maxRetries: 3,
                requestTimeout: 30000,
            });
            this.aflabContractAddress = aflabContractAddress;
            this.aavePoolAddressProviderContractAddress = aavePoolAddressProviderContractAddress;
        } catch (error) {
            logger.error(`Error initializing Controller: ${error}`, this.constructor.name);
            throw error;
        }
    }

    /**
     * Starts the Controller.
     */
    public async start() {
        try {
            this.wallet = new Wallet(this.walletPrivateKey, await this.alchemy.config.getWebSocketProvider());
        } catch (error) {
            logger.error(`Error initializing Wallet: ${error}`, this.constructor.name);
            return;
        }

        try {
            await this.initializeDexes();
        } catch (error) {
            logger.error(`Error initializing DEXes: ${error}`, this.constructor.name);
            return;
        }

        if (!this.dexes) {
            logger.error("Error initializing DEXes: DEXes not defined", this.constructor.name);
            return;
        }

        let dexInitPromises: Promise<void>[];
        try {
            dexInitPromises = this.dexes.map(async (dex: BaseDex) => {
                void dex.initialize();
            });
        } catch (error) {
            logger.error(`Error getting DEXes initialization Promises: ${error}`, this.constructor.name);
            return;
        }

        try {
            await Promise.all(dexInitPromises);
        } catch (error) {
            logger.error(`Error initializing DEXes: ${error}`, this.constructor.name);
            return;
        }
    }

    /**
     * Stops the Controller.
     */
    public stop() {
        this.alchemy.ws.removeAllListeners();
    }

    private async initializeDexes() {
        if (!this.wallet) {
            throw new Error("Wallet is not initialized");
        }

        this.dexes = [
            new UniswapV3Dex(
                this.alchemy,
                this.wallet,
                new DexPoolSubgraph(getTGUrl(this.theGraphBaseUrl, this.uniswapV3SubgraphName, this.theGraphApiKey)),
                new AflabContract(
                    this.aflabContractAddress,
                    config.AFLAB_ABI,
                    this.alchemy,
                    this.wallet,
                    137,

                    new TxHandler(
                        this.alchemy,
                        async (
                            tx: TransactionRequest,
                            cb: (error: Error | null, result: TransactionResponse | null) => void,
                        ) => {
                            let txResponse: TransactionResponse;

                            try {
                                // Get the current nonce considering the pending transactions
                                tx.nonce = await this.alchemy.core.getTransactionCount(this.wallet!.address, "pending");
                                const signedTx: string = await this.wallet!.signTransaction(tx);
                                txResponse = await this.alchemy.transact.sendTransaction(signedTx);
                            } catch (error) {
                                logger.error(`Error sending transaction: ${error}`, this.constructor.name);
                                cb(error as Error, null);
                                return;
                            }
                            try {
                                cb(null, txResponse);
                            } catch (error) {
                                logger.error(`Transaction: ${error}`, this.constructor.name);
                                cb(error as Error, null);
                            }
                        } /* This callback handles sending the transaction */,
                    ),
                ),

                new LendingPoolAPContract(
                    this.aavePoolAddressProviderContractAddress,
                    this.alchemy,
                    config.LENDING_POOL_AP_ABI,
                    137,
                ),
                137,
            ),
        ];
    }
}

export { Controller };
