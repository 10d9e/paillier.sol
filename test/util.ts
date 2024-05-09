import * as bcu from 'bigint-crypto-utils';

export function getRandom(n: bigint): bigint {
    let r: bigint = BigInt(0);
    do {
        r = bcu.randBetween(n);
    } while (bcu.gcd(r, n) !== 1n);
    return r;
}