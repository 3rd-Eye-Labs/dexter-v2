import { LiquidityPool, Token } from '@indigo-labs/iris-sdk';

export function tokensMatch(tokenA: Token, tokenB: Token): boolean {
    const tokenAId: string = tokenA === 'lovelace' ? 'lovelace' : tokenA.identifier();
    const tokenBId: string = tokenB === 'lovelace' ? 'lovelace' : tokenB.identifier();

    return tokenAId === tokenBId;
}

export function correspondingReserves(liquidityPool: LiquidityPool, token: Token): bigint[] {
    return tokensMatch(token, liquidityPool.tokenA)
        ? [liquidityPool.state.reserveA, liquidityPool.state.reserveB]
        : [liquidityPool.state.reserveB, liquidityPool.state.reserveA]
}

export function tokenId(token: Token): string {
    return token === 'lovelace'
        ? ''
        : token.identifier();
}