import { Payment, SwapBuilderParameters, SwapFee } from '../types.js';

export abstract class SwapBuilder {
    abstract estimatedGive(params: SwapBuilderParameters): bigint;
    abstract estimatedReceive(params: SwapBuilderParameters): bigint;
    abstract priceImpactPercent(params: SwapBuilderParameters): number;
    abstract fees(params: SwapBuilderParameters): SwapFee[];
    abstract buildSwapOrder(params: SwapBuilderParameters): Payment[];
    abstract buildCancelSwapOrder(params: SwapBuilderParameters): Payment[];
}