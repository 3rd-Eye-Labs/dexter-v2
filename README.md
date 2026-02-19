# Dexter v2
A composable TypeScript SDK for building and submitting Cardano DEX transactions across multiple DEXs using a clean builder pattern.

## Features
- **One swap interface** across integrations (Minswap V1/V2, Muesliswap, SundaeSwap V1/V3, WingRiders, etc.)
- **Builder pattern** for swap configuration
- **Two-way quoting**
    - Provide **inAmount** → estimate **outAmount**
    - Provide **outAmount** → estimate **inAmount**
- **Transaction lifecycle** with statuses + error details (`Building` → `Signing` → `Submitting` → `Submitted` / `Errored`)

## Installation
##### NPM
`$ npm install @3rd-eye-labs/dexter-v2`

##### PNPM
`$ pnpm install @3rd-eye-labs/dexter-v2`

##### Yarn
`$ yarn add @3rd-eye-labs/dexter-v2`

## Using

##### Dexter Instance
Dexter supports using CIP-30 wallets, and wallets by seed phrase. Each have their own required config, however here is how you can load a wallet by seed phrase :
```
const dexter = await LoadDexter({
    // Custom Iris instance, ignore if using default
    irisHost: 'http://localhost:8000',
    wallet: {
     	// Can use Blockfrost, or Kupo + Ogmios
        connection: {
            url: 'https://cardano-mainnet.blockfrost.io';
            projectId: 'project_id';
        },
        seedPhrase: ['word1', 'word2', ...],
    },
});
```

##### Submitting Swaps
```
// Pools can be grabbed from Iris, or specified directly
const lp = new LiquidityPool(
    'MinswapV2',
    'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c9b65707373c4cec488b16151a64d7102dbae16857c500652b5c513650b8d604e',
    'addr123',
    'addr1w8p79rpkcdz8x9d6tft0x0dx5mwuzac2sa4gm8cvkw5hcnqst2ctf',
    'lovelace',
    new Asset('533bb94a8850ee3ccbe483106489399112b74c905342cb1792a797a0', '494e4459'),
    1,
    null,
    new LiquidityPoolState(
        281445008120n,
        354823812631n,
        1n,
        0.3,
        0.3,
        0n,
        1,
        null,
        new Asset('f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c', '9b65707373c4cec488b16151a64d7102dbae16857c500652b5c513650b8d604e'),
    )
);

// Configure from IN token & submit
const swap = dexter.swap(dexter.minswapV2)
    .withLiquidityPool(lp)
    .withSwapInToken('lovelace')
    .withSwapInAmount(1000000n)
    .withSlippagePercent(2)
    .submit();

swap.onError((t) => {
    console.error(t);
});
swap.onSubmitted((t) => {
    console.log('Submitted!');
});

// Configure from OUT token & submit
const swap = dexter.swap(dexter.minswapV2)
    .withLiquidityPool(lp)
    .withSwapOutToken('lovelace')
    .withSwapOutAmount(1000000n)
    .withSlippagePercent(2)
    .submit();

swap.onError((t) => {
    console.error(t);
});
swap.onSubmitted((t) => {
    console.log('Submitted!');
});
```

##### Cancelling a Minswap order

Cancelling on-chain orders uses the DEX helper’s `buildCancelSwapOrder` plus the `Wallet`/`Transaction` helpers. For Minswap, you pass in the UTxO(s) that hold your existing order and Dexter builds the right spending redeemer and validator wiring.

```ts
import {
  LoadDexter,
  MinswapV2,
} from '@3rd-eye-labs/dexter-v2';
import { LiquidityPool } from '@indigo-labs/iris-sdk';
import { UTxO } from '@lucid-evolution/lucid';

const dexter = await LoadDexter({
  irisHost: 'https://iris.indigoprotocol.io',
  wallet: {
    connection: {
      url: 'https://cardano-mainnet.blockfrost.io',
      projectId: 'project_id',
    },
    seedPhrase: ['word1', 'word2', /* ... */],
  },
});

const minswap: MinswapV2 = dexter.minswapV2;

// 1. Resolve the liquidity pool and the order UTxO you want to cancel
const lp: LiquidityPool = /* fetch from Iris or other source */ {} as any;
const orderUtxo: UTxO = /* lookup user order UTxO from your indexer */ {} as any;

// 2. Ask the Minswap helper to build cancel payments
const payments = minswap.buildCancelSwapOrder({
  address: dexter.wallet.address,
  liquidityPool: lp,
  // in/out fields are unused by cancel, but required by the type
  inToken: 'lovelace',
  inAmount: 0n,
  minReceive: 0n,
  spendUtxos: [orderUtxo],
});

// 3. Build, sign, and submit the cancellation transaction
const tx = dexter.wallet
  .createTransaction();

await tx
  .payToAddresses(payments)
  .then(() => tx.sign())
  .then(() => tx.submit());

tx.onSubmitted((t) => {
  console.log('Cancel submitted with hash', t.hash);
});
```

##### Calling specific DEX helpers

Under the hood, each DEX (Minswap, Muesliswap, SundaeSwap, WingRiders, Splash, etc.) is exposed as a helper on the `Dexter` instance. These helpers all implement the `SwapBuilder` interface (`estimatedReceive`, `estimatedGive`, `fees`, `priceImpactPercent`, `buildSwapOrder`, `buildCancelSwapOrder`).

```ts
import {
    LoadDexter,
    MinswapV1,
    MinswapV2,
    Muesliswap,
    SundaeSwapV1,
    SundaeSwapV3,
    Splash,
    WingRidersV1,
    WingRidersV2,
} from '@3rd-eye-labs/dexter-v2';
import { LiquidityPool } from '@indigo-labs/iris-sdk';

const dexter = await LoadDexter({
    irisHost: 'https://iris.indigoprotocol.io',
    // wallet config optional if you only want quotes
});

// Choose which DEX you want to use
const minswapV2: MinswapV2 = dexter.minswapV2;
const muesliswap: Muesliswap = dexter.muesliswap;
const sundaeV1: SundaeSwapV1 = dexter.sundaeSwapV1;
const sundaeV3: SundaeSwapV3 = dexter.sundaeSwapV3;
const splash: Splash = dexter.splash;
const wingRidersV1: WingRidersV1 = dexter.wingRidersV1;
const wingRidersV2: WingRidersV2 = dexter.wingRidersV2;

// Liquidity pool can come from Iris or be constructed manually
const lp: LiquidityPool = /* fetch from IrisApiService or build */ {} as any;

// Example: quote how much you receive on Minswap v2 for a given input
const minswapOut = minswapV2.estimatedReceive({
    address: dexter.wallet?.address ?? '',
    liquidityPool: lp,
    inToken: 'lovelace',
    inAmount: 1_000_000n,
    minReceive: 0n,
});

// Example: quote how much you need to give on WingRiders v2 for a desired output
const wingRidersIn = wingRidersV2.estimatedGive({
    address: dexter.wallet?.address ?? '',
    liquidityPool: lp,
    outToken: 'lovelace',
    outAmount: 1_000_000n,
    minReceive: 0n,
});

// You can also inspect fees and price impact per DEX
const fees = minswapV2.fees({
    address: dexter.wallet?.address ?? '',
    liquidityPool: lp,
    minReceive: 0n,
});

const priceImpact = muesliswap.priceImpactPercent({
    address: dexter.wallet?.address ?? '',
    liquidityPool: lp,
    inToken: 'lovelace',
    inAmount: 1_000_000n,
    minReceive: 0n,
});

// Example: quote on Splash
const splashOut = splash.estimatedReceive({
    address: dexter.wallet?.address ?? '',
    liquidityPool: lp,
    inToken: 'lovelace',
    inAmount: 1_000_000n,
    minReceive: 0n,
});
```

## Running Tests
`$ pnpm run test`

## Development Notes
- Dexter uses `@indigo-labs/iris-sdk` types like LiquidityPool, LiquidityPoolState, and Token.
- Wallet integration is abstracted behind IWallet, allowing mock wallets.
- Transactions are created and executed via Transaction model.