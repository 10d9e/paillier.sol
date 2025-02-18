import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";
import { PublicKey, getPaillierKeys } from "../types/CommonTypes";
import PaillierModule from "./Paillier";

export default buildModule("DiscreteERC20Module", (m) => {
    const paillier = m.useModule(PaillierModule);

    const { publicKey } = getPaillierKeys();
    const pubKey: PublicKey = {
        n: ethers.toBeHex(publicKey.n),
        g: ethers.toBeHex(publicKey.g),
    };

    const tokenName = "Discrete Token";
    const tokenSymbol = "DCT";
    const tokenDecimals = 18;
    const initialSupply = { value: "0x00" }; // Replace with encrypted zero

    const discreteERC20 = m.contract(
        "DiscreteERC20",
        [tokenName, tokenSymbol, tokenDecimals, initialSupply, paillier.paillier, pubKey]
    );

    return { discreteERC20 };
});
