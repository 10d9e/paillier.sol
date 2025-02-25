import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Groth16VerifierModule", (m) => {
    const groth16Verifier = m.contract("Groth16Verifier");

    return { groth16Verifier };
});
