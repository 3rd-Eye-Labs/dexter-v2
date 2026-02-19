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

const ORDER_ADDRESS: string = 'addr1wxr2a8htmzuhj39y2gq7ftkpxv98y2g67tg8zezthgq4jkg0a4ul4';
const CANCEL_DATUM: string = 'd87a80';
const ORDER_SCRIPT: Script = {
    type: 'PlutusV1',
    script: '590370010000332332233322232323332223332223233223232323232332233222232322323225335301533225335301a00221333573466e3c02cdd7299a9a8101980924004a66a6a040660249000299a9a8101980924000a66a6a04066024900019a980b8900098099bac5335350203301248000d4d54054c0440088800858884008004588854cd4d4088004588854cd4d409000440088858588854cd4d4088004588854cd4d4090004588854cd4d409800440188858588854cd4d4088004588854cd4d409000440108858588854cd4d4088004400888580680644cc88d4c03400888d4c0440088888cc05cdd70019918139bac0015335350273301948000d4d54070c06001c88008588854cd4d40a4004588854cd4d40ac004588854cd4d40b4004588854cd4d40bc004588854cd4d40c4004588854cd4d40cc004588854cd4d40d400458884008cccd5cd19b8735573aa010900011980699191919191999ab9a3370e6aae75401120002333301535742a0086ae85400cd5d0a8011aba135744a004464c6a605266ae700900a80680644d5d1280089aba25001135573ca00226ea8004d5d0a8041aba135744a010464c6a604666ae7007809005004c004cccd5cd19b8750024800880688cccd5cd19b875003480008c8c074004dd69aba135573ca00a464c6a604466ae7007408c04c0480440044084584d55cea80089baa001135573ca00226ea80048848cc00400c0088004888848cccc00401401000c0088004c8004d540548894cd4d404c00440308854cd4c034ccd5cd19b8f00400200f00e100f13300500400125335350103300248000004588854cd4d4048004588854cd4d40500044cd54028010008885888c8d4d54018cd5401cd55cea80098021aab9e5001225335300b333573466e1c0140080340304004584dd5000990009aa809111999aab9f0012501223350113574200460066ae8800800d26112212330010030021120013200135500e2212253353500d0021622153353007333573466e1c00d2000009008100213353006120010013370200690010910010910009000909118010018910009000a490350543100320013550062233335573e0024a00c466a00a6eb8d5d080118019aba2002007112200212212233001004003120011200120011123230010012233003300200200148811ce6c90a5923713af5786963dee0fdffd830ca7e0c86a041d9e5833e910001',
};

export class WingRiders extends IDexterHelper implements SwapBuilder {

    buildCancelSwapOrder(params: SwapBuilderParameters): Payment[] {
        const relevantUtxo: UTxO | undefined = params.spendUtxos.find((utxo: UTxO): boolean => {
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
            new Constr(0, [
                new Constr(0, [
                    new Constr(0, [
                        new Constr(0, [
                            addressDetails.paymentCredential.hash,
                        ]),
                    ]),
                    new Constr(0, [
                        new Constr(0, [
                            new Constr(0, [
                                new Constr(0, [
                                    addressDetails.stakeCredential.hash,
                                ]),
                            ]),
                        ]),
                    ]),
                ]),
                addressDetails.paymentCredential.hash,
                BigInt(new Date().getTime() + (60 * 60 * 6 * 1000)),
                new Constr(0, [
                    new Constr(0, [
                        params.liquidityPool.tokenA === 'lovelace' ? '' : params.liquidityPool.tokenA.policyId,
                        params.liquidityPool.tokenA === 'lovelace' ? '' : params.liquidityPool.tokenA.nameHex,
                    ]),
                    new Constr(0, [
                        params.liquidityPool.tokenB.policyId,
                        params.liquidityPool.tokenB.nameHex,
                    ]),
                ]),
            ]),
            new Constr(0, [
                new Constr(swapDirection, []),
                params.minReceive,
            ]),
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
        const poolFeeModifier: bigint = poolFeeMultiplier - BigInt(Math.round((params.liquidityPool.state.sellFeePercent / 100) * Number(poolFeeMultiplier)));

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
        const poolFeeModifier: bigint = poolFeeMultiplier - BigInt(Math.round((params.liquidityPool.state.buyFeePercent / 100) * Number(poolFeeMultiplier)));

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