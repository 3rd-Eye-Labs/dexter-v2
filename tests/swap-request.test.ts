import { Dexter, LoadDexter } from '../src/index.js';
import { SwapRequest } from '../src/SwapRequest.js';
import { Asset, LiquidityPool, LiquidityPoolState } from '@indigo-labs/iris-sdk';

const lp = new LiquidityPool(
    'Minswap',
    '123',
    'addr123',
    'addr123',
    'lovelace',
    new Asset('', ''),
    1,
    null,
    new LiquidityPoolState(
        1n,
        1n,
        1n,
        2,
        2,
        0n,
        1,
    )
)

test('can create swap request', async () => {
    const dexter = await LoadDexter({});

    expect(dexter.swap(dexter.minswapV1)).toBeInstanceOf(SwapRequest);
});

test('can set in token swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace');

    expect(request.swapInToken).toBe('lovelace');
});

test('can set out token swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapOutToken('lovelace');

    expect(request.swapOutToken).toBe('lovelace');
});

test('can set in amount swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace')
        .withSwapInAmount(10n);

    expect(request.swapInAmount).toBe(10n);
});

test('can set out amount swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace')
        .withSwapOutAmount(10n);

    expect(request.swapOutAmount).toBe(10n);
});

test('can set slippage swap request', async () => {
    const dexter = await LoadDexter({});
    const request = dexter.swap(dexter.minswapV1)
        .withLiquidityPool(lp)
        .withSwapInToken('lovelace')
        .withSwapOutAmount(10n)
        .withSlippagePercent(1);

    expect(request.slippage).toBe(1);
});

test('throws if swap in token set before liquidity pool', () => {
    const dexter = new Dexter({} as any);
    const dummyBuilder: any = {
        estimatedReceive: jest.fn(),
        estimatedGive: jest.fn(),
        buildSwapOrder: jest.fn(),
    };
    const request = new SwapRequest(dexter as any, dummyBuilder);

    expect(() => request.withSwapInToken('lovelace' as any)).toThrow(/Please set a liquidity pool/);
});

test('throws if swap out token set before liquidity pool', () => {
    const dexter = new Dexter({} as any);
    const dummyBuilder: any = {
        estimatedReceive: jest.fn(),
        estimatedGive: jest.fn(),
        buildSwapOrder: jest.fn(),
    };
    const request = new SwapRequest(dexter as any, dummyBuilder);

    expect(() => request.withSwapOutToken('lovelace' as any)).toThrow(/Please set a liquidity pool/);
});

test('withSwapInAmount calls builder estimatedReceive when amount is positive', () => {
    const dexter = new Dexter({} as any);
    const builder: any = {
        estimatedReceive: jest.fn().mockReturnValue(42n),
        estimatedGive: jest.fn(),
        buildSwapOrder: jest.fn(),
    };
    const request = new SwapRequest(dexter as any, builder);

    request.withLiquidityPool(lp).withSwapInToken('lovelace' as any);
    request.withSwapInAmount(10n);

    expect(builder.estimatedReceive).toHaveBeenCalledTimes(1);
    expect(request.swapOutAmount).toBe(42n);
});

test('withSwapInAmount does not call builder when amount is zero', () => {
    const dexter = new Dexter({} as any);
    const builder: any = {
        estimatedReceive: jest.fn(),
        estimatedGive: jest.fn(),
        buildSwapOrder: jest.fn(),
    };
    const request = new SwapRequest(dexter as any, builder);

    request.withLiquidityPool(lp).withSwapInToken('lovelace' as any);
    request.withSwapInAmount(0n);

    expect(builder.estimatedReceive).not.toHaveBeenCalled();
    expect(request.swapOutAmount).toBe(0n);
});

test('withSwapOutAmount calls builder estimatedGive when amount is positive', () => {
    const dexter = new Dexter({} as any);
    const builder: any = {
        estimatedReceive: jest.fn(),
        estimatedGive: jest.fn().mockReturnValue(25n),
        buildSwapOrder: jest.fn(),
    };
    const request = new SwapRequest(dexter as any, builder);

    request.withLiquidityPool(lp).withSwapOutToken('lovelace' as any);
    request.withSwapOutAmount(10n);

    expect(builder.estimatedGive).toHaveBeenCalledTimes(1);
    expect(request.swapInAmount).toBe(25n);
});

test('withSwapOutAmount does not call builder when amount is zero', () => {
    const dexter = new Dexter({} as any);
    const builder: any = {
        estimatedReceive: jest.fn(),
        estimatedGive: jest.fn(),
        buildSwapOrder: jest.fn(),
    };
    const request = new SwapRequest(dexter as any, builder);

    request.withLiquidityPool(lp).withSwapOutToken('lovelace' as any);
    request.withSwapOutAmount(0n);

    expect(builder.estimatedGive).not.toHaveBeenCalled();
    expect(request.swapInAmount).toBe(0n);
});

test('submit throws if wallet is not connected', () => {
    const dexter = new Dexter({} as any);
    const builder: any = {
        estimatedReceive: jest.fn(),
        estimatedGive: jest.fn(),
        buildSwapOrder: jest.fn(),
    };
    const request = new SwapRequest(dexter as any, builder);

    expect(() => request.submit()).toThrow('Wallet not connected.');
});

test('submit builds swap order when wallet is connected', () => {
    const dexter = new Dexter({} as any);
    const builder: any = {
        estimatedReceive: jest.fn().mockReturnValue(10n),
        estimatedGive: jest.fn(),
        buildSwapOrder: jest.fn().mockReturnValue([]),
    };

    const txMock: any = {
        status: undefined,
        payToAddresses: jest.fn().mockResolvedValue(undefined),
        sign: jest.fn().mockResolvedValue(undefined),
        submit: jest.fn().mockResolvedValue(undefined),
    };

    const walletMock: any = {
        address: 'addr_test',
        createTransaction: jest.fn(() => txMock),
    };

    dexter.withWallet(walletMock);

    const request = new SwapRequest(dexter as any, builder);
    request.withLiquidityPool(lp).withSwapInToken('lovelace' as any).withSwapInAmount(10n);

    const tx = request.submit();

    expect(builder.buildSwapOrder).toHaveBeenCalledTimes(1);
    expect(walletMock.createTransaction).toHaveBeenCalledTimes(1);
    expect(tx).toBe(txMock);
});