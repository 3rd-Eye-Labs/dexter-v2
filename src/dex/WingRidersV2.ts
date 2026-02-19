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
import { correspondingReserves, tokenId, tokensMatch } from '../utils.js';
import { AddressType } from '../constants.js';
import { Token } from '@indigo-labs/iris-sdk';

const ORDER_ADDRESS: string = 'addr1w8qnfkpe5e99m7umz4vxnmelxs5qw5dxytmfjk964rla98q605wte';
const CANCEL_DATUM: string = 'd87a80';
const ORDER_SCRIPT: Script = {
    type: 'PlutusV2',
    script: '59019e010000323232323232323232222325333008001149858c8c8c94ccc028cdc3a40040042664601444a666aae7c0045280a99980699baf301000100314a226004601c00264646464a66601c66e1d20000021301100116301100230110013754601c601a002601a6010601800c646eb0c038c8c034c034c034c034c034c034c028004c034004c034c0300104ccc888cdc79919191bae301300132323253330123370e90000010b0800980a801180a8009baa3012301100132301230110013011300f301000133300c222533301033712900500109980199b8100248028c044c044c044c044c04400454ccc040cdc3801240002602600226644a66602466e20009200016133301122253330153370e00490000980c00089980199b8100248008c058004008004cdc0801240046022002004646eb0c044c040004c040c03c00400cdd70039bad300d001004300d002300d00137540046ea52211caf97793b8702f381976cec83e303e9ce17781458c73c4bb16fe02b83002300430040012323002233002002001230022330020020015734ae888c00cdd5000aba15573caae741',
};

export class WingRidersV2 extends IDexterHelper implements SwapBuilder {

    buildCancelSwapOrder(params: SwapBuilderParameters): Payment[] {
        const relevantUtxo: UTxO | undefined = params.spendUtxos?.find((utxo: UTxO): boolean => {
            return utxo.address === ORDER_ADDRESS;
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
        const agentFee: SwapFee | undefined = this.fees(params).find((fee: SwapFee) => fee.id === 'agentFee');
        const oil: SwapFee | undefined = this.fees(params).find((fee: SwapFee) => fee.id === 'oil');

        if (! agentFee || ! oil) {
            throw new Error('Unable to find fees for order')
        }

        const swapToken: Token = 'inToken' in params ? params.inToken : params.outToken;
        const outToken: Token = tokensMatch(swapToken, params.liquidityPool.tokenA)
            ? params.liquidityPool.tokenB
            : params.liquidityPool.tokenA;
        const swapAmount: bigint = 'inAmount' in params ? params.inAmount : params.outAmount;
        const swapDirection: number = [tokenId(swapToken), tokenId(outToken)].sort((a: string, b: string) => {
            return a.localeCompare(b);
        })[0] === tokenId(swapToken) ? 1 : 0;

        const assets: Assets = {
            lovelace: agentFee.value + oil.value + (swapToken === 'lovelace' ? swapAmount : 0n),
        };

        if (swapToken !== 'lovelace') {
            assets[swapToken.identifier('')] = swapAmount;
        }

        const addressDetails: AddressDetails = getAddressDetails(params.address);

        const datum = new Constr(0, [
            2_000000n,
            new Constr(0, [
                new Constr(0, [
                    addressDetails.paymentCredential.hash,
                ]),
                new Constr(0, [
                    new Constr(0, [
                        new Constr(0, [
                            addressDetails.stakeCredential.hash,
                        ])
                    ])
                ])
            ]),
            new Constr(0, [
                new Constr(0, [
                    addressDetails.paymentCredential.hash,
                ]),
                new Constr(0, [
                    new Constr(0, [
                        new Constr(0, [
                            addressDetails.stakeCredential.hash,
                        ])
                    ])
                ])
            ]),
            [],
            new Constr(0, []),
            BigInt(new Date().getTime() + (60 * 60 * 6 * 1000)),
            params.liquidityPool.tokenA === 'lovelace' ? '' : params.liquidityPool.tokenA.policyId,
            params.liquidityPool.tokenA === 'lovelace' ? '' : params.liquidityPool.tokenA.nameHex,
            params.liquidityPool.tokenB.policyId,
            params.liquidityPool.tokenB.nameHex,
            new Constr(0, [
                new Constr(swapDirection, []),
                params.minReceive,
            ]),
            1n,
            1n
        ]);

        return [
            {
                address: {
                    value: ORDER_ADDRESS,
                    type: AddressType.Contract,
                },
                assetBalances: assets,
                isInlineDatum: true,
                datum: Data.to(datum),
            }
        ];
    }

    estimatedGive(params: SwapBuilderParameters): bigint {
        if (! ('outToken' in params)) {
            throw new Error('No outToken specified.');
        }

        const poolFeeMultiplier: bigint = 10000n;
        const poolFeePercent: number = params.liquidityPool.state.sellFeePercent;
        const poolFeeModifier: bigint = poolFeeMultiplier - BigInt(Math.round((poolFeePercent / 100) * Number(poolFeeMultiplier)));

        const [reserveOut, reserveIn]: bigint[] = correspondingReserves(params.liquidityPool, params.outToken);

        const swapInNumerator: bigint = params.outAmount * reserveIn * poolFeeMultiplier;
        const swapInDenominator: bigint = (reserveOut - params.outAmount) * poolFeeModifier;

        return swapInNumerator / swapInDenominator;
    }

    estimatedReceive(params: SwapBuilderParameters): bigint {
        if (! ('inToken' in params)) {
            throw new Error('No inToken specified.');
        }

        const poolFeeMultiplier: bigint = 10000n;
        const poolFeePercent: number = params.liquidityPool.state.buyFeePercent;
        const poolFeeModifier: bigint = poolFeeMultiplier - BigInt(Math.round((poolFeePercent / 100) * Number(poolFeeMultiplier)));

        const [reserveIn, reserveOut]: bigint[] = correspondingReserves(params.liquidityPool, params.inToken);

        const swapOutNumerator: bigint = params.inAmount * reserveOut * poolFeeModifier;
        const swapOutDenominator: bigint = params.inAmount * poolFeeModifier + reserveIn * poolFeeMultiplier;

        return swapOutNumerator / swapOutDenominator;
    }

    fees(params: SwapBuilderParameters): SwapFee[] {
        return [
            {
                id: 'agentFee',
                title: 'Agent Fee',
                description: 'WingRiders DEX employs decentralized Agents to ensure equal access, strict fulfillment ordering and protection to every party involved in exchange for a small fee.',
                value: 2_000000n,
                isReturned: false,
            },
            {
                id: 'oil',
                title: 'Oil',
                description: 'A small amount of ADA has to be bundled with all token transfers on the Cardano Blockchain. We call this "Oil ADA" and it is always returned to the owner when the request gets fulfilled. If the request expires and the funds are reclaimed, the Oil ADA is returned as well.',
                value: 2_000000n,
                isReturned: true,
            },
        ];
    }

    priceImpactPercent(params: SwapBuilderParameters): number {
        if (! ('inToken' in params)) {
            throw new Error('No inToken specified.');
        }

        const swapOutTokenDecimals: number = tokensMatch(params.liquidityPool.tokenA, params.inToken)
            ? params.liquidityPool.tokenB.decimals
            : (params.liquidityPool.tokenA === 'lovelace' ? 6 : params.liquidityPool.tokenA.decimals)

        const estimatedReceive: bigint = this.estimatedReceive(params);
        const swapPrice: number = (Number(params.inAmount) / 10**(params.inToken === 'lovelace' ? 6 : params.inToken.decimals))
            / (Number(estimatedReceive) / 10**swapOutTokenDecimals);
        const poolPrice: number = tokensMatch(params.liquidityPool.tokenA, params.inToken)
            ? params.liquidityPool.price
            : (1 / params.liquidityPool.price);

        return Math.abs(swapPrice - poolPrice)
            / ((swapPrice + poolPrice) / 2)
            * 100;
    }

}

