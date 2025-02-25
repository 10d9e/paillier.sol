import { expect } from "chai";
import { ethers } from "hardhat";
import { DiscreteERC20Bridge, ERC20Mock, Paillier, DiscreteERC20, Groth16Verifier } from "../typechain-types";
import { Signer } from "ethers";
import * as bigIntConversion from 'bigint-conversion';
import * as paillierBigint from 'paillier-bigint';

// Public key
interface PublicKey {
    n: string;
    g: string;
}

// Ciphertext
interface Ciphertext {
    value: string;
}

// Ciphertext
interface Secp256k1Ciphertext {
    iv: string;
    ephemPublicKey: string;
    ciphertext: string;
    mac: string;
}

describe("DiscreteERC20Bridge", function () {
    let ERC20: ERC20Mock;
    let discreteERC20: DiscreteERC20;
    let paillier: Paillier;
    let bridge: DiscreteERC20Bridge;
    let owner: Signer, user1: Signer, user2: Signer;
    let publicKey: paillierBigint.PublicKey;
    let privateKey: paillierBigint.PrivateKey;
    let verifier: Groth16Verifier;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy ERC20 token
        ERC20 = await ethers.deployContract("ERC20Mock", ["TestToken", "TT", 18]);

        // Deploy Paillier
        paillier = await ethers.deployContract('Paillier');
        let addr: string = await paillier.getAddress();

        // Deploy PaillierProofVerifier
        verifier = await ethers.deployContract("Groth16Verifier");


        let keyPair = await paillierBigint.generateRandomKeys(256);
        publicKey = keyPair.publicKey;
        privateKey = keyPair.privateKey;
        //let { publicKey, privateKey } = await paillierBigint.generateRandomKeys(256);
        const pubKey: PublicKey = {
            n: ethers.toBeHex(publicKey.n),
            g: ethers.toBeHex(publicKey.g),
        };

        // Encrypt starting balance
        const starting_balance: Ciphertext = {
            value: ethers.toBeHex(publicKey.encrypt(BigInt(0))),
        };
        discreteERC20 = await ethers.deployContract('DiscreteERC20', ['DiscreteERC20', 'D20', 18, starting_balance, addr, pubKey]);

        // Deploy Wrapper
        bridge = await ethers.deployContract("DiscreteERC20Bridge", [
            ERC20.getAddress(),
            discreteERC20.getAddress(),
            paillier.getAddress(),
            pubKey,
            verifier.getAddress()
        ]);

        // Mint ERC20 tokens to users
        await ERC20.mint(await user1.getAddress(), ethers.parseEther("100"));

        await ERC20.connect(user1).approve(bridge.getAddress(), ethers.parseEther("100"));
    });

    it("should deposit tokens and mint encrypted balance", async function () {
        await expect(bridge.connect(user1).deposit(ethers.parseEther("10")))
            .to.emit(bridge, "Deposit");
    });

    it("should allow encrypted transfers", async function () {
        await bridge.connect(user1).deposit(ethers.parseEther("10"));

        // ✅ Fetch the encrypted balance of user1 after deposit
        const encryptedBalanceUser1 = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user1.getAddress()));

        // decrypt the balance and confirm it is 10
        const decryptedBalanceUser1 = BigInt(privateKey.decrypt(encryptedBalanceUser1));
        await expect(decryptedBalanceUser1).to.equal(ethers.parseEther("10"));

        // confirm that the ERC20 balance of user1 is 90
        const balanceUser1 = await ERC20.balanceOf(await user1.getAddress());
        await expect(balanceUser1).to.equal(ethers.parseEther("90"));

        // confirm that the ERC20 balance of wrapper is 10
        const balanceWrapper = await ERC20.balanceOf(bridge.getAddress());
        await expect(balanceWrapper).to.equal(ethers.parseEther("10"));

        const tokens: Ciphertext = {
            value: ethers.toBeHex(publicKey.encrypt(ethers.parseEther("3"))),
        };

        // ✅ Use the actual stored encrypted balance for transfer
        // print user2 address
        await expect(bridge.connect(user1).transferEncrypted(await user2.getAddress(), tokens))
            .to.emit(bridge, "TransferEncrypted");

        // ✅ Fetch the encrypted balance of user2 after transfer
        //const encryptedBalance2 = await wrapper.encryptedBalances(await user2.getAddress());
        const encryptedBalanceUser2 = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user2.getAddress()));

        // decrypt the balance and confirm it is 3
        const decryptedBalanceUser2 = BigInt(privateKey.decrypt(encryptedBalanceUser2));
        await expect(decryptedBalanceUser2).to.equal(ethers.parseEther("3"));

        // ✅ Fetch the encrypted balance of user1 after transfer
        //const encryptedBalance3 = await wrapper.encryptedBalances(await user1.getAddress());
        const encryptedBalanceUser1a = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user1.getAddress()));

        // decrypt the balance and confirm it is 7
        const decryptedBalanceUser1a = BigInt(privateKey.decrypt(encryptedBalanceUser1a));
        await expect(decryptedBalanceUser1a).to.equal(ethers.parseEther("7"));
    });


    it("should allow withdrawals and burn encrypted balance", async function () {
        await bridge.connect(user1).deposit(ethers.parseEther("10"));

        const encryptedAmount: Ciphertext = {
            value: ethers.toBeHex(publicKey.encrypt(ethers.parseEther("10"))),
        };

        // Generate a real proof using SnarkJS and pass it here.
        const dummyProof = {
            a: [0, 0],
            b: [
                [0, 0],
                [0, 0]
            ],
            c: [0, 0],
            input: [0, 0, 0]
        };

        await expect(bridge.connect(user1).withdraw(ethers.parseEther("10"), dummyProof.a,
            dummyProof.b,
            dummyProof.c,
            dummyProof.input))
            .to.emit(bridge, "Withdraw")
            .withArgs(await user1.getAddress(), ethers.parseEther("10"));

        // confirm that the ERC20 balance of user1 is 100
        const balanceUser1 = await ERC20.balanceOf(await user1.getAddress());
        await expect(balanceUser1).to.equal(ethers.parseEther("100"));

        // confirm that the ERC20 balance of wrapper is 0
        const balanceWrapper = await ERC20.balanceOf(bridge.getAddress());
        await expect(balanceWrapper).to.equal(ethers.parseEther("0"));

    });

    // deposit, transfer, withdraw
    it("should allow deposit, transfer, and withdraw", async function () {
        // Deposit
        await expect(bridge.connect(user1).deposit(ethers.parseEther("10")))
            .to.emit(bridge, "Deposit");

        // Transfer
        const tokens: Ciphertext = {
            value: ethers.toBeHex(publicKey.encrypt(ethers.parseEther("3"))),
        };

        await expect(bridge.connect(user1).transferEncrypted(await user2.getAddress(), tokens))
            .to.emit(bridge, "TransferEncrypted");

        // check user1 balance
        const encryptedBalanceUser1 = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user1.getAddress()));
        const decryptedBalanceUser1 = BigInt(privateKey.decrypt(encryptedBalanceUser1));
        await expect(decryptedBalanceUser1).to.equal(ethers.parseEther("7"));

        // check user2 balance
        const encryptedBalanceUser2 = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user2.getAddress()));
        const decryptedBalanceUser2 = BigInt(privateKey.decrypt(encryptedBalanceUser2));
        await expect(decryptedBalanceUser2).to.equal(ethers.parseEther("3"));

        // TODO: Generate a real proof using SnarkJS and pass it here.
        const dummyProof = {
            a: [0, 0],
            b: [
                [0, 0],
                [0, 0]
            ],
            c: [0, 0],
            input: [0, 0, 0]
        };

        await expect(bridge.connect(user1).withdraw(ethers.parseEther("7"), dummyProof.a,
            dummyProof.b,
            dummyProof.c,
            dummyProof.input))
            .to.emit(bridge, "Withdraw")
            .withArgs(await user1.getAddress(), ethers.parseEther("7"));
    });


    it("should allow deposit, transfer, and partial withdraw", async function () {
        // Deposit
        await expect(bridge.connect(user1).deposit(ethers.parseEther("10")))
            .to.emit(bridge, "Deposit");

        // Transfer
        const tokens: Ciphertext = {
            value: ethers.toBeHex(publicKey.encrypt(ethers.parseEther("3"))),
        };

        await expect(bridge.connect(user1).transferEncrypted(await user2.getAddress(), tokens))
            .to.emit(bridge, "TransferEncrypted");

        // check user1 balance
        const encryptedBalanceUser1 = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user1.getAddress()));
        const decryptedBalanceUser1 = BigInt(privateKey.decrypt(encryptedBalanceUser1));
        await expect(decryptedBalanceUser1).to.equal(ethers.parseEther("7"));

        // check user2 balance
        const encryptedBalanceUser2 = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user2.getAddress()));
        const decryptedBalanceUser2 = BigInt(privateKey.decrypt(encryptedBalanceUser2));
        await expect(decryptedBalanceUser2).to.equal(ethers.parseEther("3"));

        // TODO: Generate a real proof using SnarkJS and pass it here.
        const dummyProof = {
            a: [0, 0],
            b: [
                [0, 0],
                [0, 0]
            ],
            c: [0, 0],
            input: [0, 0, 0]
        };

        await expect(bridge.connect(user1).withdraw(ethers.parseEther("5"), dummyProof.a,
            dummyProof.b,
            dummyProof.c,
            dummyProof.input))
            .to.emit(bridge, "Withdraw")
            .withArgs(await user1.getAddress(), ethers.parseEther("5"));

        // check user1 balance
        const encryptedBalanceUser1a = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user1.getAddress()));
        const decryptedBalanceUser1a = BigInt(privateKey.decrypt(encryptedBalanceUser1a));
        await expect(decryptedBalanceUser1a).to.equal(ethers.parseEther("2"));

    });
});
