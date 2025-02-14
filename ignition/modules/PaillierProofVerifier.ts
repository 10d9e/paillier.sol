import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule("PaillierProofVerifierModule", (m) => {
    const paillierVerifier = m.contract("PaillierProofVerifier");

    return { paillierVerifier };
});
