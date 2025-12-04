import { BlockfrostConfig, Cip30Api, KupmiosConfig, Payment } from '../types.js';
import { Transaction } from '../models/Transaction.js';

export abstract class IWallet {

    public abstract isWalletLoaded: boolean;

    abstract address(): string;

    abstract publicKeyHash(): string;

    abstract stakingKeyHash(): string;

    abstract loadWallet(walletApi: Cip30Api, config: any): Promise<IWallet>;

    abstract loadWalletFromSeedPhrase(seedPhrase: string[], config: BlockfrostConfig | KupmiosConfig): Promise<IWallet>;

    abstract createTransaction(): Transaction;

    abstract paymentsForTransaction(transaction: Transaction, payToAddresses: Payment[]): Promise<Transaction>;

    abstract signTransaction(transaction: Transaction): Promise<Transaction>;

    abstract submitTransaction(transaction: Transaction): Promise<string>;

}