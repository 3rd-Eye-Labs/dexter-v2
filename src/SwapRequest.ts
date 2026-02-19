import { SwapBuilder } from './interfaces/ISwapBuilder.js';
import { Dexter } from './Dexter.js';
import { LiquidityPool, Token } from '@indigo-labs/iris-sdk';
import { tokensMatch } from './utils.js';
import { Payment, SwapBuilderParameters } from './types.js';
import { Transaction } from './models/Transaction.js';
import { TransactionStatus } from './constants.js';

export class SwapRequest {

    public swapInToken: Token;
    public swapOutToken: Token;
    public liquidityPool: LiquidityPool;
    public slippage: number = 2;
    public swapInAmount: bigint = 0n;
    public swapOutAmount: bigint = 0n;

    constructor(
        protected dexter: Dexter,
        protected builder: SwapBuilder,
    ) {}

    public withLiquidityPool(liquidityPool: LiquidityPool): SwapRequest {
        this.liquidityPool = liquidityPool;

        return this;
    }

    public withSwapInToken(token: Token): SwapRequest {
        if (! this.liquidityPool) {
            throw new Error('Please set a liquidity pool before setting swap out token.');
        }

        this.swapInToken = token;
        this.swapOutToken = tokensMatch(this.liquidityPool.tokenA, token)
            ? this.liquidityPool.tokenB
            : this.liquidityPool.tokenA;
        this.withSwapInAmount(0n);

        return this;
    }

    public withSwapOutToken(token: Token): SwapRequest {
        if (! this.liquidityPool) {
            throw new Error('Please set a liquidity pool before setting swap out token.');
        }

        this.swapOutToken = token;
        this.swapInToken = tokensMatch(this.liquidityPool.tokenA, token)
            ? this.liquidityPool.tokenB
            : this.liquidityPool.tokenA;
        this.withSwapInAmount(0n);

        return this;
    }

    public withSwapInAmount(swapInAmount: bigint): SwapRequest {
        this.swapInAmount = swapInAmount;

        if (swapInAmount > 0n) {
            this.swapOutAmount = this.builder.estimatedReceive(
                this.prepareSwapParams()
            );
        }

        return this;
    }

    public withSwapOutAmount(swapOutAmount: bigint): SwapRequest {
        this.swapOutAmount = swapOutAmount;

        if (swapOutAmount > 0n) {
            this.swapInAmount = this.builder.estimatedGive(
                this.prepareSwapParams(true)
            );
        }

        return this;
    }

    public withSlippagePercent(percent: number): SwapRequest {
        this.slippage = percent;

        return this;
    }

    public submit(): Transaction {
        if (! this.dexter.wallet) {
            throw new Error('Wallet not connected.')
        }

        const tx: Transaction = this.dexter.wallet.createTransaction();
        const payments: Payment[] = this.builder.buildSwapOrder(
            this.prepareSwapParams(),
        );

        this.sendOrder(tx, payments);

        return tx;
    }

    private sendOrder(swapTransaction: Transaction, payments: Payment[]) {
        swapTransaction.status = TransactionStatus.Building;

        swapTransaction.payToAddresses(payments)
            .then(() => {
                swapTransaction.status = TransactionStatus.Signing;

                // Sign transaction
                swapTransaction.sign()
                    .then(() => {
                        swapTransaction.status = TransactionStatus.Submitting;

                        // Submit transaction
                        swapTransaction.submit()
                            .then(() => {
                                swapTransaction.status = TransactionStatus.Submitted;
                            })
                            .catch((error) => {
                                swapTransaction.error = {
                                    step: TransactionStatus.Submitting,
                                    reason: 'Failed submitting transaction.',
                                    reasonRaw: error,
                                };
                                swapTransaction.status = TransactionStatus.Errored;
                            });
                    })
                    .catch((error) => {
                        swapTransaction.error = {
                            step: TransactionStatus.Signing,
                            reason: 'Failed to sign transaction.',
                            reasonRaw: error,
                        };
                        swapTransaction.status = TransactionStatus.Errored;
                    });
            })
            .catch((error) => {
                swapTransaction.error = {
                    step: TransactionStatus.Building,
                    reason: 'Failed to build transaction.',
                    reasonRaw: error,
                };
                swapTransaction.status = TransactionStatus.Errored;
            });
    }

    private prepareSwapParams(isReverseSwap: boolean = false): SwapBuilderParameters {
        if (! this.liquidityPool) {
            throw new Error('Please set a liquidity pool.');
        }

        const params = {
            address: this.dexter.wallet?.address ?? '',
            liquidityPool: this.liquidityPool,
            minReceive: BigInt(
                Math.floor(
                    Number(this.swapOutAmount) * (1 - this.slippage / 100)
                )
            ),
        };

        if (isReverseSwap) {
            params['outToken'] = this.swapOutToken;
            params['outAmount'] = this.swapOutAmount;
        } else {
            params['inToken'] = this.swapInToken;
            params['inAmount'] = this.swapInAmount;
        }

        return params as SwapBuilderParameters;
    }

}