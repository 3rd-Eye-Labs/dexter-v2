import { SwapBuilder } from '../interfaces/ISwapBuilder.js';
import { Payment, SwapBuilderParameters, SwapFee } from '../types.js';

export class SundaeSwapV1 extends SwapBuilder {

    buildCancelSwapOrder(params: SwapBuilderParameters): Promise<Payment[]> {
        return Promise.resolve([]);
    }

    buildSwapOrder(params: SwapBuilderParameters): Promise<Payment[]> {
        return Promise.resolve([]);
    }

    estimatedGive(params: SwapBuilderParameters): bigint {
        return 0n;
    }

    estimatedReceive(params: SwapBuilderParameters): bigint {
        return 0n;
    }

    fees(params: SwapBuilderParameters): SwapFee[] {
        return [];
    }

    priceImpactPercent(params: SwapBuilderParameters): number {
        return 0;
    }

}