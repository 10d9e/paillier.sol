import * as paillierBigint from "paillier-bigint";
import * as bigIntConversion from "bigint-conversion";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

// Public key
interface PublicKey {
  n: string;
  g: string;
}

// Ciphertext
interface Ciphertext {
  value: string;
}

describe("DiscreteERC20", function () {
  async function fixture() {
    const [admin] = await ethers.getSigners();

    const Paillier = await ethers.deployContract("Paillier");
    let add: string = await Paillier.getAddress();

    const { publicKey, privateKey } =
      await paillierBigint.generateRandomKeys(256);
    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const DiscreteERC20 = await ethers.deployContract("DiscreteERC20", [
      "DiscreteERC20",
      "D20",
      18,
      add,
      pubKey,
    ]);
    return { DiscreteERC20, publicKey, privateKey };
  }

  it("should mint 1000 tokens", async function () {
    // Signers
    const [admin, alice, bob] = await ethers.getSigners();

    // Public key
    const { DiscreteERC20, publicKey, privateKey } = await loadFixture(fixture);

    // Mint 1000 tokens
    const tokens: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(BigInt(1000))),
    };

    const dec_tokens = Number(
      privateKey.decrypt(bigIntConversion.hexToBigint(tokens.value)),
    );
    expect(dec_tokens).to.equal(1000);

    await DiscreteERC20.mint(alice.address, tokens);

    // Mint 1000 tokens
    const tokens2: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(BigInt(8473827))),
    };
    await DiscreteERC20.mint(alice.address, tokens2);

    const balance = await DiscreteERC20.balanceOf(alice.address);
    const balance_int = bigIntConversion.hexToBigint(balance);

    // Conversion to int for convenience
    const dec_balance = Number(privateKey.decrypt(balance_int));
    expect(dec_balance).to.equal(8474827);
  });

  it("should transfer 25 tokens", async function () {
    // Signers
    const [alice, bob] = await ethers.getSigners();

    // Public key
    const { DiscreteERC20, publicKey, privateKey } = await loadFixture(fixture);

    // Mint 1000 tokens
    const tokens: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(BigInt(1000))),
    };
    await DiscreteERC20.mint(alice.address, tokens);

    // Transfer 25 tokens
    const tokens2: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(BigInt(25))),
    };
    await DiscreteERC20.transfer(bob.address, tokens2, { from: alice.address });

    const balanceBob = bigIntConversion.hexToBigint(
      await DiscreteERC20.balanceOf(bob.address),
    );
    const decryptedBalanceBob = Number(privateKey.decrypt(balanceBob));
    expect(decryptedBalanceBob).to.equal(25);

    const balanceAlice = bigIntConversion.hexToBigint(
      await DiscreteERC20.balanceOf(alice.address),
    );
    const decryptedBalanceAlice = Number(privateKey.decrypt(balanceAlice));
    expect(decryptedBalanceAlice).to.equal(975);
  });

  it("should respond with the correct balance", async function () {
    // Signers
    const [alice] = await ethers.getSigners();

    // Public key
    const { DiscreteERC20, publicKey, privateKey } = await loadFixture(fixture);

    // Mint 1000 tokens
    const tokens: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(BigInt(1000))),
    };
    await DiscreteERC20.mint(alice.address, tokens);

    const balance = await DiscreteERC20.balanceOf(alice.address);
    const balance_int = bigIntConversion.hexToBigint(balance);

    // decrypted request balance
    await expect(DiscreteERC20.requestBalance())
      .to.emit(DiscreteERC20, "RequestBalance")
      .withArgs(alice.address);

    // decrypted response balance
    await expect(DiscreteERC20.responseBalance(alice.address, 1000))
      .to.emit(DiscreteERC20, "ResponseBalance")
      .withArgs(alice.address, 1000);

    // Conversion to int for convenience
    const dec_balance = Number(privateKey.decrypt(balance_int));
    expect(dec_balance).to.equal(1000);
  });
});
