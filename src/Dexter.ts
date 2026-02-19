import { MinswapV1 } from './dex/MinswapV1.js';
import { MinswapV2 } from './dex/MinswapV2.js';
import { Indigo } from './protocol/Indigo.js';
import { DexterConfig } from './types.js';
import { IWallet } from './interfaces/IWallet.js';
import { Wallet } from './models/Wallet.js';
import { IrisApiService } from '@indigo-labs/iris-sdk';
import { Muesliswap } from './dex/Muesliswap.js';
import { SundaeSwapV1 } from './dex/SundaeSwapV1.js';
import { SundaeSwapV3 } from './dex/SundaeSwapV3.js';
import { WingRidersV1 } from './dex/WingRidersV1.js';
import { WingRidersV2 } from './dex/WingRidersV2.js';
import { Splash } from './dex/Splash.js';
import { Liqwid } from './protocol/Liqwid.js';
import { Bodega } from './protocol/Bodega.js';
import { SwapRequest } from './SwapRequest.js';
import { SwapBuilder } from './interfaces/ISwapBuilder.js';

export class Dexter {

    public config: DexterConfig;
    public irisHost: string;

    protected _wallet: IWallet;
    protected _irisApi: IrisApiService;

    constructor(config: DexterConfig) {
        this.config = config;
        this.irisHost = config.irisHost ?? 'https://iris.indigoprotocol.io';

        this._irisApi = new IrisApiService(this.irisHost);
    }

    get wallet(): IWallet {
        return this._wallet;
    }

    get iris(): IrisApiService {
        return this._irisApi;
    }

    get minswapV1(): MinswapV1 {
        return new MinswapV1(this);
    }

    get minswapV2(): MinswapV2 {
        return new MinswapV2(this);
    }

    get muesliswap(): Muesliswap {
        return new Muesliswap(this);
    }

    get sundaeSwapV1(): SundaeSwapV1 {
        return new SundaeSwapV1(this);
    }

    get sundaeSwapV3(): SundaeSwapV3 {
        return new SundaeSwapV3(this);
    }

    get wingRidersV1(): WingRidersV1 {
        return new WingRidersV1(this);
    }

    get wingRidersV2(): WingRidersV2 {
        return new WingRidersV2(this);
    }

    get splash(): Splash {
        return new Splash(this);
    }

    get indigo(): Indigo {
        return new Indigo(this.irisHost);
    }

    get liqwid(): Liqwid {
        return new Liqwid(this.irisHost);
    }

    get bodega(): Bodega {
        return new Bodega(this.irisHost);
    }

    withWallet(wallet: IWallet) {
        this._wallet = wallet;
    }

    swap(dex: SwapBuilder) {
        return new SwapRequest(this, dex);
    }

}

export const LoadDexter: (config: DexterConfig) => Promise<Dexter> = async (config: DexterConfig): Promise<Dexter> => {
    const dexter: Dexter = new Dexter(config);

    if (config.wallet) {
        const wallet: Wallet = new Wallet(dexter);

        await wallet.load();

        dexter.withWallet(wallet);
    }

    return dexter;
}