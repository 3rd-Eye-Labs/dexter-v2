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

## Running Tests
`$ pnpm run test`

## Development Notes
- Dexter uses `@indigo-labs/iris-sdk` types like LiquidityPool, LiquidityPoolState, and Token.
- Wallet integration is abstracted behind IWallet, allowing mock wallets.
- Transactions are created and executed via Transaction model.