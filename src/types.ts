import { LiquidityPool, Token } from '@indigo-labs/iris-sdk';
import { UTxO } from '@lucid-evolution/lucid';
import { AddressType, TransactionStatus } from './constants.js';

export type ArcConfig = {
    irisHost?: string,
    wallet?: {
        connection: BlockfrostConfig | KupmiosConfig,
        accountIndex?: number,
        seedPhrase: string[],
    } | {
        accountIndex?: number,
        cip30: Cip30Api,
    },
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
    inToken: Token,
    inAmount: bigint,
    spendUtxos?: UTxO[],
} | {
    liquidityPool: LiquidityPool,
    outToken: Token,
    outAmount: bigint,
    spendUtxos?: UTxO[],
};

export interface BlockfrostConfig {
    url: string;
    projectId: string;
}

export interface KupoConfig {
    url: string;
}

export interface KupmiosConfig {
    kupoUrl: string;
    ogmiosUrl: string;
}

export type TransactionError = {
    step: TransactionStatus;
    reason: string;
    reasonRaw: string;
};

export type Cip30Api = {
    getNetworkId(): Promise<number>;
    getUtxos(): Promise<string[] | undefined>;
    getBalance(): Promise<string>;
    getUsedAddresses(): Promise<string[]>;
    getUnusedAddresses(): Promise<string[]>;
    getChangeAddress(): Promise<string>;
    getRewardAddresses(): Promise<string[]>;
    signTx(tx: string, partialSign: boolean): Promise<string>;
    signData(
        address: string,
        payload: string
    ): Promise<{
        signature: string;
        key: string;
    }>;
    submitTx(tx: string): Promise<string>;
    getCollateral(): Promise<string[]>;
    experimental: {
        getCollateral(): Promise<string[]>;
        on(eventName: string, callback: (...args: unknown[]) => void): void;
        off(eventName: string, callback: (...args: unknown[]) => void): void;
    };
};