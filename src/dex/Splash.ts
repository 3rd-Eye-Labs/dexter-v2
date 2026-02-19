import { SwapBuilder } from '../interfaces/ISwapBuilder.js';
import { Payment, SwapBuilderParameters, SwapFee } from '../types.js';
import { IDexterHelper } from '../interfaces/IDexterHelper.js';
import {
    AddressDetails,
    Assets,
    Constr,
    credentialToAddress,
    Data,
    getAddressDetails,
    Script,
    UTxO,
} from '@lucid-evolution/lucid';
import { AddressType } from '../constants.js';
import { correspondingReserves, tokensMatch } from '../utils.js';
import { Token } from '@indigo-labs/iris-sdk';

const CANCEL_DATUM: string = 'd87980';
const ORDER_SCRIPT_HASH: string = '464eeee89f05aff787d40045af2a40a83fd96c513197d32fbc54ff02';
const ORDER_SCRIPT: Script = {
    type: 'PlutusV2',
    script: '59042d01000033232323232323222323232232253330093232533300b0041323300100137566022602460246024602460246024601c6ea8008894ccc040004528099299980719baf00d300f301300214a226600600600260260022646464a66601c6014601e6ea80044c94ccc03cc030c040dd5000899191929998090038a99980900108008a5014a066ebcc020c04cdd5001180b180b980b980b980b980b980b980b980b980b98099baa00f3375e600860246ea8c010c048dd5180a98091baa00230043012375400260286eb0c050c054c054c044dd50028b1991191980080080191299980a8008a60103d87a80001323253330143375e6016602c6ea80080144cdd2a40006603000497ae0133004004001301900230170013758600a60206ea8010c04cc040dd50008b180098079baa0052301230130013322323300100100322533301200114a0264a66602066e3cdd7180a8010020a5113300300300130150013758602060226022602260226022602260226022601a6ea8004dd71808180898089808980898089808980898089808980898069baa0093001300c37540044601e00229309b2b19299980598050008a999804180218048008a51153330083005300900114a02c2c6ea8004c8c94ccc01cc010c020dd50028991919191919191919191919191919191919191919191919299981118128010991919191924c646600200200c44a6660500022930991980180198160011bae302a0015333022301f30233754010264646464a666052605800426464931929998141812800899192999816981800109924c64a666056605000226464a66606060660042649318140008b181880098169baa0021533302b3027001132323232323253330343037002149858dd6981a800981a8011bad30330013033002375a6062002605a6ea800858c0acdd50008b181700098151baa0031533302830240011533302b302a37540062930b0b18141baa002302100316302a001302a0023028001302437540102ca666042603c60446ea802c4c8c8c8c94ccc0a0c0ac00852616375a605200260520046eb4c09c004c08cdd50058b180d006180c8098b1bac30230013023002375c60420026042004603e002603e0046eb4c074004c074008c06c004c06c008c064004c064008dd6980b800980b8011bad30150013015002375a60260026026004602200260220046eb8c03c004c03c008dd7180680098049baa0051625333007300430083754002264646464a66601c60220042930b1bae300f001300f002375c601a00260126ea8004588c94ccc01cc0100044c8c94ccc030c03c00852616375c601a00260126ea800854ccc01cc00c0044c8c94ccc030c03c00852616375c601a00260126ea800858c01cdd50009b8748008dc3a4000ae6955ceaab9e5573eae815d0aba24c0126d8799fd87a9f581c96f5c1bee23481335ff4aece32fe1dfa1aa40a944a66d2d6edc9a9a5ffff0001',
};
const BATCHER_KEY: string = '5cb2c968e5d1c7197a6ce7615967310a375545d9bc65063a964335b2';

const EXECUTOR_FEE: bigint = 1_100000n;
const WORST_ORDER_STEP_COST: bigint = 900_000n;

export class Splash extends IDexterHelper implements SwapBuilder {

    buildCancelSwapOrder(params: SwapBuilderParameters): Payment[] {
        const relevantUtxo: UTxO | undefined = params.spendUtxos?.find((utxo: UTxO) => {
            const addressDetails: AddressDetails | undefined = getAddressDetails(utxo.address);

            return (addressDetails.paymentCredential?.hash ?? '') === ORDER_SCRIPT_HASH;
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
            throw new Error('Unable to find fees for order');
        }

        if (!('inToken' in params)) {
            throw new Error('No inToken specified.');
        }

        const swapInToken: Token = params.inToken;
        const swapOutToken: Token = tokensMatch(swapInToken, params.liquidityPool.tokenA)
            ? params.liquidityPool.tokenB
            : params.liquidityPool.tokenA;

        const swapInAmount: bigint = params.inAmount;

        const assets: Assets = {
            lovelace: batcherFee.value + deposit.value,
        };

        const addressDetails: AddressDetails = getAddressDetails(params.address);

        const outDecimals: number = swapOutToken === 'lovelace'
            ? 6
            : 0;

        const decimalToFractionalImproved = (decimalValue: number): [bigint, bigint] => {
            const [whole, decimals = ''] = decimalValue.toString().split('.');
            const truncated = decimals.slice(0, 15);
            const denominator: bigint = BigInt(10 ** truncated.length || 1);
            const numerator: bigint = BigInt(whole) * denominator + BigInt(truncated || '0');
            return [numerator, denominator];
        };

        const [lpFeeNumerator, lpFeeDenominator] = decimalToFractionalImproved(
            Number(params.minReceive) / 10 ** outDecimals,
        );

        const swapInPolicyId: string = swapInToken === 'lovelace' ? '' : swapInToken.policyId;
        const swapInAssetName: string = swapInToken === 'lovelace' ? '' : swapInToken.nameHex;
        const swapOutPolicyId: string = swapOutToken === 'lovelace' ? '' : swapOutToken.policyId;
        const swapOutAssetName: string = swapOutToken === 'lovelace' ? '' : swapOutToken.nameHex;

        const beacon: string = ''.padStart(56, '0');

        const datum = new Constr(0, [
            '00',
            beacon,
            new Constr(0, [
                swapInPolicyId,
                swapInAssetName,
            ]),
            swapInAmount,
            WORST_ORDER_STEP_COST,
            params.minReceive,
            new Constr(0, [
                swapOutPolicyId,
                swapOutAssetName,
            ]),
            new Constr(0, [
                lpFeeNumerator,
                lpFeeDenominator,
            ]),
            EXECUTOR_FEE,
            new Constr(0, [
                new Constr(0, [
                    new Constr(0, [
                        addressDetails.paymentCredential.hash,
                    ]),
                ]),
                new Constr(0, [
                    new Constr(0, [
                        new Constr(0, [
                            addressDetails.stakeCredential?.hash ?? '',
                        ]),
                    ]),
                ]),
            ]),
            addressDetails.paymentCredential.hash,
            [
                BATCHER_KEY,
            ],
        ]);

        return [
            {
                address: {
                    value: credentialToAddress(
                        'Mainnet',
                        {
                            type: 'Script',
                            hash: ORDER_SCRIPT_HASH,
                        },
                        addressDetails.stakeCredential,
                    ),
                    type: AddressType.Contract,
                },
                assetBalances: assets,
                isInlineDatum: true,
                datum: Data.to(datum),
            }
        ];
    }

    estimatedGive(params: SwapBuilderParameters): bigint {
        if (!('outToken' in params)) {
            throw new Error('No outToken specified.');
        }

        const [reserveOut, reserveIn]: bigint[] = correspondingReserves(params.liquidityPool, params.outToken);

        return (reserveIn * reserveOut) / (reserveOut - params.outAmount) - reserveIn;
    }

    estimatedReceive(params: SwapBuilderParameters): bigint {
        if (!('inToken' in params)) {
            throw new Error('No inToken specified.');
        }

        const [reserveIn, reserveOut]: bigint[] = correspondingReserves(params.liquidityPool, params.inToken);

        return reserveOut - (reserveIn * reserveOut) / (reserveIn + params.inAmount);
    }

    fees(params: SwapBuilderParameters): SwapFee[] {
        const networkFee: number = 0.5;
        const reward: number = 1;
        const minNitro: number = 1.2;
        const batcherFee: number = (reward + networkFee) * minNitro;
        const batcherFeeInAda: bigint = BigInt(Math.round(batcherFee * 10 ** 6));

        return [
            {
                id: 'batcherFee',
                title: 'Batcher Fee',
                description: 'Fee paid for the service of off-chain batcher to process transactions.',
                value: batcherFeeInAda,
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
        if (!('inToken' in params)) {
            throw new Error('No inToken specified.');
        }

        const reserveIn: bigint = tokensMatch(params.inToken, params.liquidityPool.tokenA)
            ? params.liquidityPool.state.reserveA
            : params.liquidityPool.state.reserveB;

        return (1 - Number(reserveIn) / Number(reserveIn + params.inAmount)) * 100;
    }

}

