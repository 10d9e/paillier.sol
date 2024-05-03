import * as paillierBigint from 'paillier-bigint';
import * as bigIntConversion from 'bigint-conversion';
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Paillier", function () {

    it("should add 2 ciphertexts", async function () {
        const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(256);
        const a: bigint = BigInt(1);
        const b: bigint = BigInt(2);
        const enc_a = ethers.toBeHex(publicKey.encrypt(a));
        const enc_b = ethers.toBeHex(publicKey.encrypt(b));

        // Public key
        const pub_n = ethers.toBeHex(publicKey.n);

        // bit length will differ to what has been stated in this script.
        // if using 256-bit key, bit_length will be 264 as "0x" prefix may have been factored in  

        // Now lets deploy the contract
        const [owner] = await ethers.getSigners();
        const paillierSolidity = await ethers.deployContract("Paillier");
        const enc_sum = await paillierSolidity.add(enc_a, enc_b, pub_n);
        const enc_sum_int = bigIntConversion.hexToBigint(enc_sum[0]);

        // Conversion to int for convenience
        const dec_sum = Number(privateKey.decrypt(enc_sum_int));
        console.log("Decrypted Sum:", dec_sum);

        // We want dec_sum to equal 3
        expect(dec_sum).to.equal(3);

    });

    it("should encrypt zero", async function () {
        const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(256);
        const [owner] = await ethers.getSigners();
        const paillierSolidity = await ethers.deployContract("Paillier");
        // Arbitary random number - 10000
        const rand = ethers.toBeHex(Math.floor(Math.random() * 10000));

        // Public key
        const pub_n = ethers.toBeHex(publicKey.n);
        const enc_zero = await paillierSolidity.encryptZero(rand, pub_n);
        const enc_zero_int = bigIntConversion.hexToBigint(enc_zero[0]);
        const dec_zero = Number(privateKey.decrypt(enc_zero_int));
        expect(dec_zero).to.equal(0);

    });

    it("should multiply encrypted value by a scalar", async function () {
        const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(256);
        const [owner] = await ethers.getSigners();
        const paillierSolidity = await ethers.deployContract("Paillier");
        const a: bigint = BigInt(2);
        const b: bigint = BigInt(5);
        const enc_a = ethers.toBeHex(publicKey.encrypt(a));

        // Public key
        const pub_n = ethers.toBeHex(publicKey.n);
        const enc_scalar = await paillierSolidity.mul(enc_a, b, pub_n);

        // returns tuple so get first index
        const enc_scalar_int = bigIntConversion.hexToBigint(enc_scalar[0]);

        const dec_scalar = Number(privateKey.decrypt(enc_scalar_int));
        console.log("Decrypted Scalar:", dec_scalar);
        expect(dec_scalar).to.equal(10);

    });

});