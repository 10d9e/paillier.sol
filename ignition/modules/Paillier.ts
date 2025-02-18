import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PaillierModule", (m) => {
    const paillier = m.contract("Paillier");

    return { paillier };
});
