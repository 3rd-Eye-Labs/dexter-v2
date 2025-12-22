
## Installation
##### NPM
`$ npm install @3rd-eye-labs/dexter-v2`

##### PNPM
`$ pnpm install @3rd-eye-labs/dexter-v2`

##### Yarn
`$ yarn add @3rd-eye-labs/dexter-v2`

## Using

##### Arc Instance
Arc supports using CIP-30 wallets, and wallets by seed phrase. Each have their own required config, however here is how you can load a wallet by seed phrase :
```
const arc = await LoadDexter({
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

## Tests
`$ pnpm run test`