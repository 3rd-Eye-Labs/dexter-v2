import { BlockfrostConfig, Cip30Api, KupmiosConfig, Payment } from '../types.js';
import { Transaction } from '../models/Transaction.js';

export abstract class IWallet {

    public abstract isWalletLoaded: boolean;
    public abstract address: string;
    public abstract publicKeyHash: string;
    public abstract stakingKeyHash: string | null;

    abstract createTransaction(): Transaction;

    abstract paymentsForTransaction(transaction: Transaction, payToAddresses: Payment[]): Promise<Transaction>;

    abstract signTransaction(transaction: Transaction): Promise<Transaction>;

    abstract submitTransaction(transaction: Transaction): Promise<string>;

}