import * as bigIntConversion from 'bigint-conversion';
import * as bcu from 'bigint-crypto-utils';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import * as paillierBigint from 'paillier-bigint';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { getRandom } from './util';

// Public key
interface PublicKey {
  n: string;
  g: string;
}

// Private key
interface PrivateKey {
  lambda: string;
  mu: string;
}

// Ciphertext
interface Ciphertext {
  value: string;
}

function L(a: bigint, n: bigint): bigint {
  return (a - 1n) / n;
}

describe('Paillier', function () {

  async function fixture() {
    // const [admin] = await ethers.getSigners();
    const Paillier = await ethers.deployContract('Paillier');
    const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(256);
    return { Paillier, publicKey, privateKey };
  }

  it('should add 2 ciphertexts', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    const a: bigint = BigInt(1);
    const b: bigint = BigInt(2);
    const enc_a: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(a)),
    };
    const enc_b: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(b)),
    };

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };

    // bit length will differ to what has been stated in this script.
    // if using 256-bit key, bit_length will be 264 as "0x" prefix may have been factored in
    // Now lets deploy the contract and test the addition
    const enc_sum = await Paillier.add(enc_a, enc_b, pubKey);
    const enc_sum_int = bigIntConversion.hexToBigint(enc_sum[0]);

    // Conversion to int for convenience
    const dec_sum = Number(privateKey.decrypt(enc_sum_int));
    // We want dec_sum to equal 3
    expect(dec_sum).to.equal(3);
  });

  it('should add a ciphertext and plaintext', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    const a: bigint = BigInt(1);
    const b: bigint = BigInt(2);
    const enc_a = { value: ethers.toBeHex(publicKey.encrypt(a)) };
    const enc_b = { value: ethers.toBeHex(publicKey.encrypt(b)) };

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const enc_sum = await Paillier.add_const(enc_a, b, pubKey);
    const enc_sum_int = bigIntConversion.hexToBigint(enc_sum[0]);
    const dec_sum = Number(privateKey.decrypt(enc_sum_int));
    expect(dec_sum).to.equal(3);
  });

  it('should subtract 2 ciphertexts', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    const a: bigint = BigInt(5);
    const b: bigint = BigInt(2);
    const enc_a = { value: ethers.toBeHex(publicKey.encrypt(a)) };
    const enc_b = { value: ethers.toBeHex(publicKey.encrypt(b)) };

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const enc_diff = await Paillier.sub(enc_a, enc_b, pubKey);
    const enc_diff_int = bigIntConversion.hexToBigint(enc_diff[0]);
    const dec_diff = Number(privateKey.decrypt(enc_diff_int));
    expect(dec_diff).to.equal(3);
  });

  it('should subtract a ciphertext and plaintext', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    const a: bigint = BigInt(42);
    const b: bigint = BigInt(5);
    const enc_a = { value: ethers.toBeHex(publicKey.encrypt(a)) };

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const enc_diff = await Paillier.sub_const(enc_a, b, pubKey);
    const enc_diff_int = bigIntConversion.hexToBigint(enc_diff[0]);
    const dec_diff = Number(privateKey.decrypt(enc_diff_int));
    expect(dec_diff).to.equal(37);
  });

  it('should encrypt zero', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    let r: bigint = getRandom(publicKey.n);
    const rand = '0x' + bigIntConversion.bigintToHex(r);

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const enc_zero = await Paillier.encryptZero(rand, pubKey);
    const enc_zero_int = bigIntConversion.hexToBigint(enc_zero[0]);
    const dec_zero = Number(privateKey.decrypt(enc_zero_int));
    expect(dec_zero).to.equal(0);
  });

  it('should multiply encrypted value by a scalar', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    const a: bigint = BigInt(2);
    const b: bigint = BigInt(5);
    const enc_a = { value: ethers.toBeHex(publicKey.encrypt(a)) };

    BigInt.length;

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const enc_scalar = await Paillier.mul_const(enc_a, b, pubKey);

    // returns tuple so get first index
    const enc_scalar_int = bigIntConversion.hexToBigint(enc_scalar[0]);
    const dec_scalar = Number(privateKey.decrypt(enc_scalar_int));
    expect(dec_scalar).to.equal(10);
  });

  it('should decrypt a ciphertext', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    const a: bigint = BigInt(42);
    const ea: bigint = publicKey.encrypt(a);
    const enc_a = { value: ethers.toBeHex(ea) };

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const privKey: PrivateKey = {
      lambda: ethers.toBeHex(privateKey.lambda),
      mu: ethers.toBeHex(privateKey.mu),
    };

    // decryption is (((c^(lambda) % n^2) - 1) / n) * mu % n
    // precalculate expensive division operation, verified on the contract
    let sigma = L(bcu.modPow(ea, privateKey.lambda, publicKey._n2), publicKey.n);

    const dec_a = await Paillier.decrypt(enc_a, pubKey, privKey, ethers.toBeHex(sigma));
    const dec_a_int = bigIntConversion.hexToBigint(dec_a[0]);
    expect(dec_a_int).to.equal(42);
  });

  it('should encrypt a value', async function () {
    const { Paillier, publicKey, privateKey } = await loadFixture(fixture);
    const a = 42;
    let r: bigint = getRandom(publicKey.n);
    const rand = '0x' + bigIntConversion.bigintToHex(r);

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const privKey: PrivateKey = {
      lambda: ethers.toBeHex(privateKey.lambda),
      mu: ethers.toBeHex(privateKey.mu),
    };

    const enc_a = await Paillier.encrypt(a, rand, pubKey);
    const enc_a_int = bigIntConversion.hexToBigint(enc_a[0]);
    const dec_scalar = Number(privateKey.decrypt(enc_a_int));
    expect(dec_scalar).to.equal(a);
  });
});
