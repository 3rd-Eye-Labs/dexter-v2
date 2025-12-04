import { MinswapV1 } from './dex/MinswapV1.js';
import { MinswapV2 } from './dex/MinswapV2.js';
import { Indigo } from './protocol/Indigo.js';
import { ArcConfig } from './types.js';
import { IWallet } from './interfaces/IWallet.js';
import { Wallet } from './models/Wallet.js';
import { IrisApiService } from '@indigo-labs/iris-sdk';
import { Muesliswap } from './dex/Muesliswap.js';
import { Splash } from './dex/Splash.js';
import { SundaeSwapV1 } from './dex/SundaeSwapV1.js';
import { SundaeSwapV3 } from './dex/SundaeSwapV3.js';
import { WingRidersV1 } from './dex/WingRidersV1.js';
import { WingRidersV2 } from './dex/WingRidersV2.js';

export class Arc {

    protected _config: ArcConfig;

    protected _wallet: IWallet;
    protected _irisApi: IrisApiService;

    constructor(config: ArcConfig) {
        this._config = config;

        this._irisApi = new IrisApiService(config.irisHost ?? 'https://iris.indigoprotocol.io');
    }

    get iris(): Indigo {
        return this._irisApi;
    }

    get minswapV1(): MinswapV1 {
        return new MinswapV1();
    }

    get minswapV2(): MinswapV2 {
        return new MinswapV2();
    }

    get muesliswap(): Muesliswap {
        return new Muesliswap();
    }

    get splash(): Splash {
        return new Splash();
    }

    get sundaeSwapV1(): SundaeSwapV1 {
        return new SundaeSwapV1();
    }

    get sundaeSwapV3(): SundaeSwapV3 {
        return new SundaeSwapV3();
    }

    get wingRidersV1(): WingRidersV1 {
        return new WingRidersV1();
    }

    get wingRidersV2(): WingRidersV2 {
        return new WingRidersV2();
    }

    get indigo(): Indigo {
        return new MinswapV2();
    }

    withWallet(wallet: IWallet) {
        this._wallet = wallet;
    }

}

export const LoadArc: (config: ArcConfig) => Promise<Arc> = async (config: ArcConfig): Promise<Arc> => {
    const arc: Arc = new Arc(config);

    if (config.wallet) {
        const wallet: Wallet = new Wallet();

        await (
            'seedPhrase' in config.wallet
                ? wallet.loadWalletFromSeedPhrase(config.wallet.seedPhrase, config.wallet.connection)
                : wallet.loadWallet(config.wallet.cip30)
        );

        arc.withWallet(wallet);
    }

    return arc;
}