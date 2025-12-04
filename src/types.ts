import { LiquidityPool, Token } from '@indigo-labs/iris-sdk';
import { UTxO } from '@lucid-evolution/lucid';

export enum AddressType {
  Contract,
  Base,
  Enterprise,
}

export type AssetBalance = {
    asset: Token,
    quantity: bigint,
};

export type SwapFee = {
    id: string,
    title: string,
    description: string,
    value: bigint,
    isReturned: boolean,
};

export type Payment = {
    address: {
        value: string,
        type: AddressType,
    },
    assetBalances: AssetBalance[],
    spendUtxos?: UTxO[],
    datum?: string,
    isInlineDatum: boolean,
};

export type SwapBuilderParameters = {
    liquidityPool: LiquidityPool,
} & (
    {
        inToken?: Token,
        inAmount?: bigint,
        outAmount?: bigint,
        spendUtxos?: UTxO[],
    } | {
    inToken?: Token,
    outToken?: Token,
    inAmount?: bigint,
    outAmount?: bigint,
    spendUtxos?: UTxO[],
}
)

export abstract class SwapBuilder {
    abstract estimatedGive(params: SwapBuilderParameters): bigint;
    abstract estimatedReceive(params: SwapBuilderParameters): bigint;
    abstract priceImpactPercent(params: SwapBuilderParameters): number;
    abstract fees(params: SwapBuilderParameters): SwapFee[];
    abstract buildSwapOrder(params: SwapBuilderParameters): Promise<Payment[]>;
    abstract buildCancelSwapOrder(params: SwapBuilderParameters): Promise<Payment[]>;
}