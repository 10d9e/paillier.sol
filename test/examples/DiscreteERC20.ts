import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import * as bigIntConversion from 'bigint-conversion';
import { expect } from 'chai';
import * as ethCrypto from 'eth-crypto';
import { ethers } from 'hardhat';
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

describe('DiscreteERC20', function () {
  async function fixture() {
    const [admin] = await ethers.getSigners();

    const Paillier = await ethers.deployContract('Paillier');
    let add: string = await Paillier.getAddress();

    const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(256);
    // Public key
    const pubKey: PublicKey = {
      n: ethers.toBeHex(publicKey.n),
      g: ethers.toBeHex(publicKey.g),
    };
    const DiscreteERC20 = await ethers.deployContract('DiscreteERC20', ['DiscreteERC20', 'D20', 18, add, pubKey]);
    return { DiscreteERC20, publicKey, privateKey };
  }

  it('should mint 1000 tokens', async function () {
    // Signers
    const [admin, alice, bob] = await ethers.getSigners();

    // Public key
    const { DiscreteERC20, publicKey, privateKey } = await loadFixture(fixture);

    // Mint 1000 tokens
    const tokens: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(BigInt(1000))),
    };

    const dec_tokens = Number(privateKey.decrypt(bigIntConversion.hexToBigint(tokens.value)));
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

  it('should transfer 25 tokens', async function () {
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

    const balanceBob = bigIntConversion.hexToBigint(await DiscreteERC20.balanceOf(bob.address));
    const decryptedBalanceBob = Number(privateKey.decrypt(balanceBob));
    expect(decryptedBalanceBob).to.equal(25);

    const balanceAlice = bigIntConversion.hexToBigint(await DiscreteERC20.balanceOf(alice.address));
    const decryptedBalanceAlice = Number(privateKey.decrypt(balanceAlice));
    expect(decryptedBalanceAlice).to.equal(975);
  });

  it('should respond with the correct balance, encrypted under the accounts public key', async function () {
    // Signers
    const [alice] = await ethers.getSigners();
    const alicePrivateKey = '8355bb293b8714a06b972bfe692d1bd9f24235c1f4007ae0be285d398b0bba2f';
    const alicePublickey = '03cde4881d65c3ef7c7254ffb7808df3243e579554cb173ad6a184ab2691293250';
    // Public key
    const { DiscreteERC20, publicKey, privateKey } = await loadFixture(fixture);

    // Mint 1000 tokens
    const tokens: Ciphertext = {
      value: ethers.toBeHex(publicKey.encrypt(BigInt(1000))),
    };
    await DiscreteERC20.mint(alice.address, tokens);
    const balance = await DiscreteERC20.balanceOf(alice.address);
    const requestBalance = await DiscreteERC20.requestBalance({ from: alice.address });
    expect(requestBalance.from).to.equal(alice.address);
    expect(requestBalance).to.emit(DiscreteERC20, 'RequestBalance').withArgs(alice.address);

    // get the hex string of the balance
    const balanceHex = bigIntConversion.bigintToHex(BigInt(1000));

    // TODO: in a real-world scenario, the public key would be recovered from the signature of the transaction
    /*
    const tx = await ethers.provider.getTransaction(requestBalance.hash);
    const baseTx = {
      to: tx?.to,
      nonce: tx?.nonce,
      data: tx?.data,
      value: tx?.value,
      gasLimit: tx?.gasLimit,
      gasPrice: tx?.gasPrice,
      chainId: tx?.chainId,
    };
    const sig = ethers.Signature.from(tx?.signature);
    const unsignedTx = ethers.Transaction.from(baseTx).unsignedSerialized;
    const preimage = ethers.keccak256(unsignedTx);
    const signstr = ethCrypto.vrs.toString({
      v: '27',
      r: sig.r,
      s: sig.s,
    });
    const publickey = ethCrypto.recoverPublicKey(signstr, preimage);
    */
    const encrypted = await ethCrypto.encryptWithPublicKey(alicePublickey, balanceHex);
    const ctxt: Secp256k1Ciphertext = {
      iv: '0x' + encrypted.iv,
      ephemPublicKey: '0x' + encrypted.ephemPublicKey,
      ciphertext: '0x' + encrypted.ciphertext,
      mac: '0x' + encrypted.mac,
    };
    const expectedCtxt = [
      '0x' + encrypted.iv,
      '0x' + encrypted.ephemPublicKey,
      '0x' + encrypted.ciphertext,
      '0x' + encrypted.mac,
    ];

    // respond with the balance encrypted under the requester's public key
    let reponseBalanceTx = await DiscreteERC20.responseBalance(alice.address, ctxt);

    // decrypted response balance
    await expect(reponseBalanceTx).to.emit(DiscreteERC20, 'ResponseBalance').withArgs(alice.address, expectedCtxt);

    const decrypted: string = await ethCrypto.decryptWithPrivateKey(alicePrivateKey, {
      iv: expectedCtxt[0].slice(2),
      ephemPublicKey: expectedCtxt[1].slice(2),
      ciphertext: expectedCtxt[2].slice(2),
      mac: expectedCtxt[3].slice(2),
    });
    const decryptedInt = bigIntConversion.hexToBigint(decrypted);
    // Conversion to int for convenience
    const dec_balance = Number(decryptedInt);
    expect(dec_balance).to.equal(decryptedInt);
  });
});
