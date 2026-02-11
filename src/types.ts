import { LiquidityPool, Token } from '@indigo-labs/iris-sdk';
import { Script, UTxO } from '@lucid-evolution/lucid';
import { AddressType, TransactionStatus } from './constants.js';
import { Assets } from '@lucid-evolution/lucid';

export type DexterConfig = {
    irisHost?: string,
    wallet?: {
        connection: BlockfrostConfig | KupmiosConfig,
        accountIndex?: number,
        seedPhrase: string[],
    } | {
        connection: BlockfrostConfig | KupmiosConfig,
        cip30: Cip30Api,
    },
}

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
    assetBalances: Assets,
    spendUtxos?: {
        utxo: UTxO,
        redeemer: string,
        validator: Script,
        signer: string,
        isInlineDatum: boolean,
    }[],
    isInlineDatum?: boolean,
    datum?: string,
};

export type SwapBuilderParameters = {
    address: string,
    liquidityPool: LiquidityPool,
    inToken: Token,
    inAmount: bigint,
    spendUtxos?: UTxO[],
    minReceive: bigint,
} | {
    address: string,
    liquidityPool: LiquidityPool,
    outToken: Token,
    outAmount: bigint,
    spendUtxos?: UTxO[],
    minReceive: bigint,
};

export interface BlockfrostConfig {
    url: string;
    projectId: string;
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