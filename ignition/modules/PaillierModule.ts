import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PaillierModule = buildModule("PaillierModule", (m) => {
  const paillier = m.contract("Paillier", []);
  return { paillier };
});

export default PaillierModule;
