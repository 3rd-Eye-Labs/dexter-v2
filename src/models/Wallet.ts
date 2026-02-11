import { IWallet } from '../interfaces/IWallet.js';
import { Payment } from '../types.js';
import { Transaction } from './Transaction.js';
import {
    AddressDetails,
    Blockfrost,
    getAddressDetails,
    Kupmios,
    Lucid,
    LucidEvolution, TxHash, TxSignBuilder,
    TxSigned,
} from '@lucid-evolution/lucid';
import { Dexter } from '../Dexter.js';
import { AddressType } from '../constants.js';

export class Wallet extends IWallet {

    isWalletLoaded: boolean;
    lucid: LucidEvolution;

    address: string;
    publicKeyHash: string;
    stakingKeyHash: string;

    constructor(
        protected dexter: Dexter,
    ) {
        super();
    }

    load() {
        return Lucid(
            'url' in this.dexter.config.wallet.connection
                ? new Blockfrost(this.dexter.config.wallet.connection.url, this.dexter.config.wallet.connection.projectId)
                : new Kupmios(this.dexter.config.wallet.connection.kupoUrl, this.dexter.config.wallet.connection.ogmiosUrl),
            'Mainnet',
        ).then(async (evo: LucidEvolution) => {
            this.lucid = evo;

            if ('seedPhrase' in this.dexter.config.wallet) {
                this.lucid.selectWallet.fromSeed(
                    this.dexter.config.wallet.seedPhrase.join(' '),
                    {
                        accountIndex: this.dexter.config.wallet.accountIndex ?? 0,
                    }
                );
            } else {
                this.lucid.selectWallet.fromAPI(this.dexter.config.wallet.cip30);
            }

            this.address = await this.lucid.wallet().address();

            const addressDetails: AddressDetails = getAddressDetails(this.address);

            this.publicKeyHash = addressDetails.paymentCredential.hash;
            this.stakingKeyHash = addressDetails.stakeCredential?.hash;
        });
    }

    createTransaction(): Transaction {
        const tx = new Transaction(this);

        tx.providerData.tx = this.lucid.newTx();

        return tx;
    }

    paymentsForTransaction(transaction: Transaction, payToAddresses: Payment[]): Promise<Transaction> {
        payToAddresses.forEach((payToAddress: Payment) => {
            if (payToAddress.spendUtxos && payToAddress.spendUtxos.length > 0) {
                payToAddress.spendUtxos.forEach((spendUtxo) => {
                    transaction.providerData.tx.collectFrom([
                        {
                            txHash: spendUtxo.utxo.txHash,
                            outputIndex: spendUtxo.utxo.outputIndex,
                            address: spendUtxo.utxo.address,
                            datumHash: spendUtxo.utxo.datum ? null : spendUtxo.utxo.datumHash,
                            datum: spendUtxo.utxo.datum,
                            assets: spendUtxo.utxo.assets,
                        }
                    ], spendUtxo.redeemer);

                    if (spendUtxo.validator) {
                        transaction.providerData.tx.attach.SpendingValidator(spendUtxo.validator);
                    }

                    if (spendUtxo.signer) {
                        transaction.providerData.tx.addSigner(spendUtxo.signer);
                    }
                });
            }

            switch (payToAddress.address.type) {
                case AddressType.Contract:
                    transaction.providerData.tx.pay.ToContract(
                        payToAddress.address.value,
                        payToAddress.isInlineDatum
                            ? {
                                kind: 'inline',
                                value: payToAddress.datum,
                            }
                            : {
                                kind: 'asHash',
                                value: payToAddress.datum
                            },
                        payToAddress.assetBalances,
                    );
                    break;
                case AddressType.Base:
                case AddressType.Enterprise:
                    transaction.providerData.tx.pay.ToAddress(
                        payToAddress.address.value,
                        payToAddress.assetBalances,
                    );
                    break;
                default:
                    throw new Error('Encountered unknown address type.');
            }
        });

        return transaction.providerData.tx.complete()
            .then((tx: TxSignBuilder) => {
                transaction.providerData.tx = tx;

                return transaction;
            });
    }

    signTransaction(transaction: Transaction): Promise<Transaction> {
        return transaction.providerData.tx.sign.withWallet().complete()
            .then((signedTx: TxSigned) => {
                transaction.providerData.tx = signedTx;

                return transaction;
            });
    }

    submitTransaction(transaction: Transaction): Promise<string> {
        return transaction.providerData.tx.submit()
            .then((txHash: TxHash) => {
                return txHash;
            });
    }

}