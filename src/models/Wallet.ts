import { IWallet } from '../interfaces/IWallet.js';
import { BlockfrostConfig, Cip30Api, KupmiosConfig, Payment } from '../types.js';
import { Transaction } from './Transaction.js';

export class Wallet extends IWallet {

    isWalletLoaded: boolean;

    constructor() {
        super();

        //todo
    }

    address(): string {
        return '';
    }

    createTransaction(): Transaction {
        return undefined;
    }

    loadWallet(walletApi: Cip30Api): Promise<IWallet> {
        return Promise.resolve(undefined);
    }

    loadWalletFromSeedPhrase(seedPhrase: string[], config: BlockfrostConfig | KupmiosConfig): Promise<IWallet> {
        return Promise.resolve(undefined);
    }

    paymentsForTransaction(transaction: Transaction, payToAddresses: Payment[]): Promise<Transaction> {
        return Promise.resolve(undefined);
    }

    publicKeyHash(): string {
        return '';
    }

    signTransaction(transaction: Transaction): Promise<Transaction> {
        return Promise.resolve(undefined);
    }

    stakingKeyHash(): string {
        return '';
    }

    submitTransaction(transaction: Transaction): Promise<string> {
        return Promise.resolve('');
    }

}