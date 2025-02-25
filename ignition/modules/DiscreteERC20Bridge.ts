import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";
import { PublicKey, getPaillierKeys } from "../types/CommonTypes";
import PaillierModule from "./Paillier";
import Groth16VerifierModule from "./Groth16Verifier";
import DiscreteERC20Module from "./DiscreteERC20";
import ERC20MockModule from "./ERC20Mock";

export default buildModule("DiscreteERC20BridgeModule", (m) => {

    const erc20Mock = m.useModule(ERC20MockModule);
    const discreteERC20 = m.useModule(DiscreteERC20Module);
    const paillier = m.useModule(PaillierModule);
    const verifier = m.useModule(Groth16VerifierModule);

    const { publicKey } = getPaillierKeys();
    const pubKey: PublicKey = {
        n: ethers.toBeHex(publicKey.n),
        g: ethers.toBeHex(publicKey.g),
    };

    const discreteERC20Bridge = m.contract(
        "DiscreteERC20Bridge",
        [
            erc20Mock.erc20Mock,
            discreteERC20.discreteERC20,
            paillier.paillier,
            pubKey,
            verifier.groth16Verifier
        ]
    );

    return { discreteERC20Bridge };
});
