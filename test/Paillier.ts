import * as paillierBigint from "paillier-bigint";
import * as bigIntConversion from "bigint-conversion";
import { ethers } from "hardhat";
import { expect } from "chai";

// Public key
interface PublicKey {
  n: string;
  g: string;
}

// Ciphertext
interface Ciphertext {
  value: string;
}

describe("Paillier", function () {
  it("should add 2 ciphertexts", async function () {
    const Paillier = await ethers.deployContract("Paillier");

    const { publicKey, privateKey } =
      await paillierBigint.generateRandomKeys(256);
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
    console.log("Decrypted Sum:", dec_sum);

    // We want dec_sum to equal 3
    expect(dec_sum).to.equal(3);
  });

  it("should add a ciphertext and plaintext", async function () {
    const { publicKey, privateKey } =
      await paillierBigint.generateRandomKeys(256);
    const Paillier = await ethers.deployContract("Paillier");
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
    console.log("Decrypted Sum:", dec_sum);
    expect(dec_sum).to.equal(3);
  });

  it("should subtract 2 ciphertexts", async function () {
    const { publicKey, privateKey } =
      await paillierBigint.generateRandomKeys(256);
    const Paillier = await ethers.deployContract("Paillier");
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
    console.log("Decrypted Difference:", dec_diff);
    expect(dec_diff).to.equal(3);
  });

  it("should subtract a ciphertext and plaintext", async function () {
    const { publicKey, privateKey } =
      await paillierBigint.generateRandomKeys(256);
    const Paillier = await ethers.deployContract("Paillier");
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
    console.log("Decrypted Difference:", dec_diff);
    expect(dec_diff).to.equal(37);
  });

  it("should encrypt zero", async function () {
    const { publicKey, privateKey } =
      await paillierBigint.generateRandomKeys(256);
    const Paillier = await ethers.deployContract("Paillier");
    // Arbitary random number - 1000000
    const rand = ethers.toBeHex(Math.floor(Math.random() * 1000000));

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

  it("should multiply encrypted value by a scalar", async function () {
    const { publicKey, privateKey } =
      await paillierBigint.generateRandomKeys(256);
    const [owner] = await ethers.getSigners();
    const Paillier = await ethers.deployContract("Paillier");
    const a: bigint = BigInt(2);
    const b: bigint = BigInt(5);
    const enc_a = { value: ethers.toBeHex(publicKey.encrypt(a)) };

    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const enc_scalar = await Paillier.mul_const(enc_a, b, pubKey);

    // returns tuple so get first index
    const enc_scalar_int = bigIntConversion.hexToBigint(enc_scalar[0]);

    const dec_scalar = Number(privateKey.decrypt(enc_scalar_int));
    console.log("Decrypted Scalar:", dec_scalar);
    expect(dec_scalar).to.equal(10);
  });
});
