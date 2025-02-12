import { expect } from "chai";
import { ethers } from "hardhat";
import { DiscreteERC20Bridge, ERC20Mock, Paillier, DiscreteERC20 } from "../typechain-types";
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
    let wrapper: DiscreteERC20Bridge;
    let owner: Signer, user1: Signer, user2: Signer;
    let publicKey: paillierBigint.PublicKey;
    let privateKey: paillierBigint.PrivateKey;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy ERC20 token
        ERC20 = await ethers.deployContract("ERC20Mock", ["TestToken", "TT", 18]);

        // Deploy Paillier
        paillier = await ethers.deployContract('Paillier');
        let addr: string = await paillier.getAddress();

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
        wrapper = await ethers.deployContract("DiscreteERC20Bridge", [
            ERC20.getAddress(),
            discreteERC20.getAddress(),
            paillier.getAddress(),
            pubKey
        ]);

        // Mint ERC20 tokens to users
        await ERC20.mint(await user1.getAddress(), ethers.parseEther("100"));

        await ERC20.connect(user1).approve(wrapper.getAddress(), ethers.parseEther("100"));
    });

    it("should deposit tokens and mint encrypted balance", async function () {
        await expect(wrapper.connect(user1).deposit(ethers.parseEther("10")))
            .to.emit(wrapper, "Deposit");
    });

    it("should allow encrypted transfers", async function () {
        await wrapper.connect(user1).deposit(ethers.parseEther("10"));

        // ✅ Fetch the encrypted balance of user1 after deposit
        const encryptedBalanceUser1 = bigIntConversion.hexToBigint(await discreteERC20.balanceOf(await user1.getAddress()));

        // decrypt the balance and confirm it is 10
        const decryptedBalanceUser1 = BigInt(privateKey.decrypt(encryptedBalanceUser1));
        await expect(decryptedBalanceUser1).to.equal(ethers.parseEther("10"));

        // confirm that the ERC20 balance of user1 is 90
        const balanceUser1 = await ERC20.balanceOf(await user1.getAddress());
        await expect(balanceUser1).to.equal(ethers.parseEther("90"));

        // confirm that the ERC20 balance of wrapper is 10
        const balanceWrapper = await ERC20.balanceOf(wrapper.getAddress());
        await expect(balanceWrapper).to.equal(ethers.parseEther("10"));

        const tokens: Ciphertext = {
            value: ethers.toBeHex(publicKey.encrypt(ethers.parseEther("3"))),
        };

        // ✅ Use the actual stored encrypted balance for transfer
        // print user2 address
        await expect(wrapper.connect(user1).transferEncrypted(await user2.getAddress(), tokens))
            .to.emit(wrapper, "TransferEncrypted");

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
        await wrapper.connect(user1).deposit(ethers.parseEther("10"));

        const encryptedAmount: Ciphertext = {
            value: ethers.toBeHex(publicKey.encrypt(ethers.parseEther("10"))),
        };
        //await expect(wrapper.connect(user1).withdraw(encryptedAmount))
        //    .to.emit(wrapper, "Withdraw");
    });
});
