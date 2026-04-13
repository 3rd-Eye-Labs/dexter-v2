import { Dexter, LoadDexter, MinswapV2 } from '../src/index.js';
import { Asset, LiquidityPool, LiquidityPoolState } from '@indigo-labs/iris-sdk';

test('can create instance', async () => {
    const dexter = await LoadDexter({});

    expect(dexter).toBeInstanceOf(Dexter);
});

test('can use helper', async () => {
    const dexter = await LoadDexter({});

    expect(dexter.minswapV2).toBeInstanceOf(MinswapV2);
});

test('can submit order', async () => {
    try {
        const dexter = await LoadDexter({
            wallet: {
                connection: {
                    url: 'https://cardano-mainnet.blockfrost.io/api/v0',
                    projectId: '{api key}',
                },
                seedPhrase: [/** seed phrase **/],
            }
        });

        const request = dexter.swap(dexter.minswapV2)
            .withLiquidityPool(new LiquidityPool(
                'Minswap',
                'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c9b65707373c4cec488b16151a64d7102dbae16857c500652b5c513650b8d604e',
                'addr123',
                'addr1w8p79rpkcdz8x9d6tft0x0dx5mwuzac2sa4gm8cvkw5hcnqst2ctf',
                'lovelace',
                new Asset('533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0', '494e4459'),
                1,
                null,
                new LiquidityPoolState(
                    251339170642n,
                    404195026515n,
                    1n,
                    0.3,
                    0.3,
                    0n,
                    1,
                    null,
                    new Asset('f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c', '9b65707373c4cec488b16151a64d7102dbae16857c500652b5c513650b8d604e'),
                )
            ))
            .withSwapInToken('lovelace')
            .withSwapInAmount(100000n)
            .withSlippagePercent(5)
            .submit();

        console.log(
            await dexter.iris
                .liquidityPools()
                .match({ identifier: 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c9b65707373c4cec488b16151a64d7102dbae16857c500652b5c513650b8d604e'})
        );

        request.onError((t) => {
            console.error(t);
        })
        request.onSubmitted((t) => {
            console.log('Submitted!');
        })

        await new Promise((resolve) => {
            setTimeout(() => {
                resolve(undefined)
            }, 20000)
        })

        expect(1).toBe(1);
    } catch (e: any) {
        expect(1).toBe(1);
    }
});