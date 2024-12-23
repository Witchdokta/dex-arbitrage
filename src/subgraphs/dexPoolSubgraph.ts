import { BaseSubgraph } from "./baseSubgraph.js";
import { getHoursSinceUnixEpoch, logger } from "../common.js";
import { LiquidityPoolHourlySnapshot, Pool } from "../types.js";

interface FetchPoolsContext {
    uniquePoolIds: Set<string>;
    allPools: Pool[];
    totalRecords: number;
}

/**
 * DexPoolSubgraph is a class that provides methods to interact with the
 * DexPoolSubgraph v3 subgraph developed by Messari.
 *
 * https://github.com/messari/subgraphs/tree/master/subgraphs/uniswap-v3-forks
 */
class DexPoolSubgraph extends BaseSubgraph {
    /**
     * @param url The base URL for the The Graph Node
     */
    constructor(url: string) {
        super(url);
    }

    /**
     * Retrieves a list of pools with pagination and limiting options.
     *
     * @param limit - The maximum number of pools to retrieve. Defaults to 100.
     * @param numPagesToFetch - The number of pages to fetch per call. Defaults to 10.
     * @param pageSize - The number of pools per page. Defaults to 10.
     * @param hsUnixEpoch - Hours since the Unix Epoch minus one, used as an index for the subgraph's hourly snapshots.
     * @returns A promise that resolves to an array of Pool objects.
     */
    public async getPools(
        limit = 100,
        numPagesToFetch = 10,
        pageSize = 10,
        hsUnixEpoch: number = getHoursSinceUnixEpoch(),
    ): Promise<Pool[]> {
        const allPools: Pool[] = [];
        const uniquePoolIds = new Set<string>();
        let skip = 0;
        const context: FetchPoolsContext = {
            uniquePoolIds,
            allPools,
            totalRecords: 0,
        };

        logger.debug(
            `Getting pools. Parameters: {` +
                `limit: ${limit}, ` +
                `numOfPagesPerCall: ${numPagesToFetch}, ` +
                `pageSize: ${pageSize}, ` +
                `hoursSinceUnixEpoch: ${hsUnixEpoch}}`,
            this.constructor.name,
        );

        await this.handlePoolFetching(hsUnixEpoch, numPagesToFetch, pageSize, skip, limit, context);
        return allPools;
    }

    protected customInit(): void {
        /* Define queries */
        this.addQuery(
            "pools",
            `
      query ($hoursSinceUnixEpoch: Int!, $size: Int!, $offset: Int!) {
      liquidityPoolHourlySnapshots(
        first: $size,
        skip: $offset,
        orderBy: hourlySwapCount,
        orderDirection: desc,
        where: { hour: $hoursSinceUnixEpoch }
      ) {
        pool {
        id
        name
        symbol
        fees {
          feePercentage
          feeType
        }
        inputTokens {
          id
          name
          symbol
          decimals
        }
        }
      }
      }
      `,
        );
    }

    /**
     * Fetches pools from the subgraph until the limit is reached.
     */
    private async handlePoolFetching(
        hsUnixEpoch: number,
        numPagesToFetch: number,
        pageSize: number,
        skip: number,
        limit: number,
        context: FetchPoolsContext,
    ): Promise<void> {
        let hasMore = true;
        while (hasMore && context.totalRecords < limit) {
            try {
                const returnInfo = await this.fetchPoolPages(
                    hsUnixEpoch,
                    numPagesToFetch,
                    pageSize,
                    skip,
                    limit,
                    context,
                );
                context.totalRecords += returnInfo.fetchedRecords;
                hasMore = returnInfo.hasMore;
                skip += numPagesToFetch * pageSize;
            } catch (error) {
                logger.error(`Error fetching data: ${error}`, this.constructor.name);
                throw error;
            }
        }
    }

    /*
     * Fetches pools from the subgraph.
     *
     * @param hsUnixEpoch The hours since Unix Epoch
     * @param numPagesToFetch The number of pages to fetch
     * @param pageSize The page size
     * @param skip The number of records to skip
     * @param limit The maximum number of records to fetch
     * @param context The context object
     * @returns The number of fetched records and a boolean indicating if there are more records to fetch
     */
    private async fetchPoolPages(
        hsUnixEpoch: number,
        numPagesToFetch: number,
        pageSize: number,
        skip: number,
        limit: number,
        context: FetchPoolsContext,
    ): Promise<{ fetchedRecords: number; hasMore: boolean }> {
        const query = this.getQuery("pools");
        const fetchPromises = [];
        for (let i = 0; i < numPagesToFetch; i++) {
            fetchPromises.push(
                this.fetchData(query, {
                    hoursSinceUnixEpoch: hsUnixEpoch,
                    size: pageSize,
                    offset: skip + i * pageSize,
                }),
            );
        }

        const responses = await Promise.all(fetchPromises);
        let fetchedRecords = 0;

        for (const response of responses) {
            if (!response) {
                throw new Error(`Invalid Response: ${JSON.stringify(response)}`);
            }

            const snapshots: LiquidityPoolHourlySnapshot[] = response.liquidityPoolHourlySnapshots;
            const pools: Pool[] = snapshots.map((snapshot: LiquidityPoolHourlySnapshot) => snapshot.pool);

            for (const pool of pools) {
                if (!context.uniquePoolIds.has(pool.id)) {
                    context.uniquePoolIds.add(pool.id);
                    context.allPools.push(pool);
                    fetchedRecords++;
                    if (fetchedRecords >= limit) break;
                }
            }
        }

        logger.debug(`Fetched ${fetchedRecords} records.`, this.constructor.name);

        const hasMore = fetchedRecords === numPagesToFetch * pageSize && context.totalRecords + fetchedRecords < limit;
        return { fetchedRecords, hasMore };
    }
}

export { DexPoolSubgraph };
