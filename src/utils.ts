import { LiquidityPool, Token } from '@indigo-labs/iris-sdk';

export function tokensMatch(tokenA: Token, tokenB: Token): boolean {
    return tokenId(tokenA) === tokenId(tokenB);
}

export function correspondingReserves(liquidityPool: LiquidityPool, token: Token): bigint[] {
    return tokensMatch(token, liquidityPool.tokenA)
        ? [liquidityPool.state.reserveA, liquidityPool.state.reserveB]
        : [liquidityPool.state.reserveB, liquidityPool.state.reserveA]
}

export function tokenId(token: Token | ''): string {
    return token === 'lovelace' || token === ''
        ? ''
        : token.identifier();
}