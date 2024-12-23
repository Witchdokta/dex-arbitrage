export default [
    {
        inputs: [],
        name: "acceptOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "asset",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "premium",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "",
                type: "address",
            },
            {
                internalType: "bytes",
                name: "params",
                type: "bytes",
            },
        ],
        name: "executeOperation",
        outputs: [
            {
                internalType: "bool",
                name: "isSuccess",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        components: [
                            {
                                internalType: "address",
                                name: "tokenIn",
                                type: "address",
                            },
                            {
                                internalType: "address",
                                name: "tokenOut",
                                type: "address",
                            },
                            {
                                internalType: "uint24",
                                name: "poolFee",
                                type: "uint24",
                            },
                            {
                                internalType: "uint256",
                                name: "amountOutMinimum",
                                type: "uint256",
                            },
                        ],
                        internalType: "struct UniswapV3Arbitrage.SwapInfo",
                        name: "swap1",
                        type: "tuple",
                    },
                    {
                        components: [
                            {
                                internalType: "address",
                                name: "tokenIn",
                                type: "address",
                            },
                            {
                                internalType: "address",
                                name: "tokenOut",
                                type: "address",
                            },
                            {
                                internalType: "uint24",
                                name: "poolFee",
                                type: "uint24",
                            },
                            {
                                internalType: "uint256",
                                name: "amountOutMinimum",
                                type: "uint256",
                            },
                        ],
                        internalType: "struct UniswapV3Arbitrage.SwapInfo",
                        name: "swap2",
                        type: "tuple",
                    },
                    {
                        components: [
                            {
                                internalType: "address",
                                name: "tokenIn",
                                type: "address",
                            },
                            {
                                internalType: "address",
                                name: "tokenOut",
                                type: "address",
                            },
                            {
                                internalType: "uint24",
                                name: "poolFee",
                                type: "uint24",
                            },
                            {
                                internalType: "uint256",
                                name: "amountOutMinimum",
                                type: "uint256",
                            },
                        ],
                        internalType: "struct UniswapV3Arbitrage.SwapInfo",
                        name: "swap3",
                        type: "tuple",
                    },
                    {
                        internalType: "uint256",
                        name: "extraCost",
                        type: "uint256",
                    },
                ],
                internalType: "struct UniswapV3Arbitrage.ArbitInfo",
                name: "data",
                type: "tuple",
            },
            {
                internalType: "uint256",
                name: "tokenAIn",
                type: "uint256",
            },
        ],
        name: "initiateFlashLoan",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "addressProvider",
                type: "address",
            },
            {
                internalType: "address",
                name: "sRouter",
                type: "address",
            },
        ],
        stateMutability: "payable",
        type: "constructor",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
        ],
        name: "OwnableInvalidOwner",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "OwnableUnauthorizedAccount",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint32",
                name: "executionId",
                type: "uint32",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "inputAmount",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "swap1AmountOut",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "swap2AmountOut",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "swap3AmountOut",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "profit",
                type: "uint256",
            },
        ],
        name: "ArbitrageConcluded",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint32",
                name: "executionId",
                type: "uint32",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "FlashLoanSuccess",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint32",
                name: "executionId",
                type: "uint32",
            },
            {
                indexed: false,
                internalType: "string",
                name: "message",
                type: "string",
            },
        ],
        name: "FlashloanError",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "toAccount",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "balance",
                type: "uint256",
            },
        ],
        name: "NativeTokenWithdrawn",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferStarted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "previousOwner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "OwnershipTransferred",
        type: "event",
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "uint32",
                name: "executionId",
                type: "uint32",
            },
            {
                indexed: true,
                internalType: "address",
                name: "tokenIn",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "tokenOut",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount0Delta",
                type: "uint256",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount1Delta",
                type: "uint256",
            },
        ],
        name: "SwapExecuted",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "token",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "toAccount",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "balance",
                type: "uint256",
            },
        ],
        name: "TokenWithdrawn",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "newOwner",
                type: "address",
            },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address",
            },
        ],
        name: "withdraw",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [],
        name: "withdrawNative",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        stateMutability: "payable",
        type: "receive",
    },
    {
        inputs: [],
        name: "ADDRESSES_PROVIDER",
        outputs: [
            {
                internalType: "contract IPoolAddressesProvider",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address",
            },
        ],
        name: "getBalance",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getBalanceReceived",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getExecutionCounter",
        outputs: [
            {
                internalType: "uint32",
                name: "",
                type: "uint32",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "owner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "pendingOwner",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "POOL",
        outputs: [
            {
                internalType: "contract IPool",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];
