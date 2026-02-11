import { SwapBuilder } from '../interfaces/ISwapBuilder.js';
import { Payment, SwapBuilderParameters, SwapFee } from '../types.js';
import { IDexterHelper } from '../interfaces/IDexterHelper.js';
import {
    AddressDetails,
    Assets,
    Constr,
    Data,
    getAddressDetails,
    Script,
    UTxO,
} from '@lucid-evolution/lucid';
import { AddressType } from '../constants.js';
import { correspondingReserves, tokensMatch } from '../utils.js';
import { Token } from '@indigo-labs/iris-sdk';

const MARKET_ORDER_ADDRESS: string = 'addr1wxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uwc0h43gt';
const LIMIT_ORDER_ADDRESS: string = 'addr1zxn9efv2f6w82hagxqtn62ju4m293tqvw0uhmdl64ch8uw6j2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pq6s3z70';
const CANCEL_DATUM: string = 'd87a80';
const ORDER_SCRIPT: Script = {
    type: 'PlutusV1',
    script: '59014f59014c01000032323232323232322223232325333009300e30070021323233533300b3370e9000180480109118011bae30100031225001232533300d3300e22533301300114a02a66601e66ebcc04800400c5288980118070009bac3010300c300c300c300c300c300c300c007149858dd48008b18060009baa300c300b3754601860166ea80184ccccc0288894ccc04000440084c8c94ccc038cd4ccc038c04cc030008488c008dd718098018912800919b8f0014891ce1317b152faac13426e6a83e06ff88a4d62cce3c1634ab0a5ec133090014a0266008444a00226600a446004602600a601a00626600a008601a006601e0026ea8c03cc038dd5180798071baa300f300b300e3754601e00244a0026eb0c03000c92616300a001375400660106ea8c024c020dd5000aab9d5744ae688c8c0088cc0080080048c0088cc00800800555cf2ba15573e6e1d200201',
};

export class MinswapV1 extends IDexterHelper implements SwapBuilder {

    buildCancelSwapOrder(params: SwapBuilderParameters): Payment[] {
        const relevantUtxo: UTxO | undefined = params.spendUtxos.find((utxo: UTxO) => {
            return [MARKET_ORDER_ADDRESS, LIMIT_ORDER_ADDRESS].includes(utxo.address);
        });

        if (! relevantUtxo) {
            throw new Error('Unable to find relevant UTxO for cancelling the swap order.');
        }

        return [
            {
                address: {
                    value: params.address,
                    type: AddressType.Base,
                },
                assetBalances: relevantUtxo.assets,
                spendUtxos: [{
                    utxo: relevantUtxo,
                    redeemer: CANCEL_DATUM,
                    validator: ORDER_SCRIPT,
                    signer: params.address,
                    isInlineDatum: false,
                }],
            }
        ];
    }

    buildSwapOrder(params: SwapBuilderParameters): Payment[] {
        const batcherFee: SwapFee | undefined = this.fees(params).find((fee: SwapFee) => fee.id === 'batcherFee');
        const deposit: SwapFee | undefined = this.fees(params).find((fee: SwapFee) => fee.id === 'deposit');

        if (! batcherFee || ! deposit) {
            throw new Error('Unable to find fees for order')
        }

        const swapToken: Token = 'inToken' in params ? params.inToken : params.outToken;
        const outToken: Token = tokensMatch(swapToken, params.liquidityPool.tokenA)
            ? params.liquidityPool.tokenB
            : params.liquidityPool.tokenA;
        const swapAmount: bigint = 'inAmount' in params ? params.inAmount : params.outAmount;

        const assets: Assets = {
            lovelace: batcherFee.value + deposit.value + (swapToken === 'lovelace' ? swapAmount : 0n),
        };

        if (swapToken !== 'lovelace') {
            assets[swapToken.identifier('')] = swapAmount;
        }

        const addressDetails: AddressDetails = getAddressDetails(params.address);

        const datum = new Constr(0, [
            new Constr(0, [
                new Constr(0, [
                    new Constr(0, [
                        addressDetails.paymentCredential.hash,
                    ]),
                ]),
                new Constr(0, [
                    new Constr(0, [
                        new Constr(0, [
                            addressDetails.stakeCredential.hash,
                        ]),
                    ]),
                ]),
            ]),
            new Constr(0, [
                new Constr(0, [
                    new Constr(0, [
                        addressDetails.paymentCredential.hash,
                    ]),
                ]),
                new Constr(0, [
                    new Constr(0, [
                        new Constr(0, [
                            addressDetails.stakeCredential.hash,
                        ]),
                    ]),
                ]),
            ]),
            new Constr(1, []),
            new Constr(0, [
                new Constr(0, [
                    outToken === 'lovelace' ? '' : outToken.policyId,
                    outToken === 'lovelace' ? '' : outToken.nameHex,
                ]),
                params.minReceive,
            ]),
            batcherFee.value,
            deposit.value,
        ]);

        return [
            {
                address: {
                    value: MARKET_ORDER_ADDRESS,
                    type: AddressType.Contract,
                },
                assetBalances: assets,
                isInlineDatum: false,
                datum: Data.to(datum),
            }
        ];
    }

    estimatedGive(params: SwapBuilderParameters): bigint {
        const poolFeeMultiplier: bigint = 10000n;
        const poolFeePercent: number = 'inToken' in params ? params.liquidityPool.state.buyFeePercent : params.liquidityPool.state.sellFeePercent;
        const poolFeeModifier: bigint = poolFeeMultiplier - BigInt(Math.round((poolFeePercent / 100) * Number(poolFeeMultiplier)));

        const [reserveOut, reserveIn]: bigint[] = correspondingReserves(params.liquidityPool, 'inToken' in params ? params.inToken : params.outToken);
        const swapAmount: bigint = 'inAmount' in params ? params.inAmount : params.outAmount;

        const swapInNumerator: bigint = swapAmount * reserveIn * poolFeeMultiplier;
        const swapInDenominator: bigint = (reserveOut - swapAmount) * poolFeeModifier;

        return swapInNumerator / swapInDenominator + 1n;
    }

    estimatedReceive(params: SwapBuilderParameters): bigint {
        const poolFeeMultiplier: bigint = 10000n;
        const poolFeePercent: number = 'inToken' in params ? params.liquidityPool.state.buyFeePercent : params.liquidityPool.state.sellFeePercent;
        const poolFeeModifier: bigint = poolFeeMultiplier - BigInt(Math.round((poolFeePercent / 100) * Number(poolFeeMultiplier)));

        const [reserveIn, reserveOut]: bigint[] = correspondingReserves(params.liquidityPool, 'inToken' in params ? params.inToken : params.outToken);
        const swapAmount: bigint = 'inAmount' in params ? params.inAmount : params.outAmount;

        const swapOutNumerator: bigint = swapAmount * reserveOut * poolFeeModifier;
        const swapOutDenominator: bigint = swapAmount * poolFeeModifier + reserveIn * poolFeeMultiplier;

        return swapOutNumerator / swapOutDenominator;
    }

    fees(params: SwapBuilderParameters): SwapFee[] {
        return [
            {
                id: 'batcherFee',
                title: 'Batcher Fee',
                description: 'Fee paid for the service of off-chain Laminar batcher to process transactions.',
                value: 2_000000n,
                isReturned: false,
            },
            {
                id: 'deposit',
                title: 'Deposit',
                description: 'This amount of ADA will be held as minimum UTxO ADA and will be returned when your order is processed or cancelled.',
                value: 2_000000n,
                isReturned: true,
            },
        ];
    }

    priceImpactPercent(params: SwapBuilderParameters): number {
        const poolFeeMultiplier: bigint = 10000n;
        const poolFeePercent: number = 'inToken' in params ? params.liquidityPool.state.buyFeePercent : params.liquidityPool.state.sellFeePercent;

        const poolFeeModifier: bigint = poolFeeMultiplier - BigInt(Math.round((poolFeePercent / 100) * Number(poolFeeMultiplier)));

        const [reserveIn, reserveOut]: bigint[] = correspondingReserves(params.liquidityPool, 'inToken' in params ? params.inToken : params.outToken);
        const swapAmount: bigint = 'inAmount' in params ? params.inAmount : params.outAmount;

        const swapOutNumerator: bigint = swapAmount * poolFeeModifier * reserveOut;
        const swapOutDenominator: bigint = swapAmount * poolFeeModifier + reserveIn * poolFeeMultiplier;

        const priceImpactNumerator: bigint = (reserveOut * swapAmount * swapOutDenominator * poolFeeModifier)
            - (swapOutNumerator * reserveIn * poolFeeMultiplier);
        const priceImpactDenominator: bigint = reserveOut * swapAmount * swapOutDenominator * poolFeeMultiplier;

        return Number(priceImpactNumerator * 100n) / Number(priceImpactDenominator);
    }

}