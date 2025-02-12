import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { IgnitionModule } from "@nomicfoundation/hardhat-ignition/types";

const DiscreteERC20BridgeModule: IgnitionModule = buildModule("DiscreteERC20Bridge", (m) => {
    const erc20 = m.contract("ERC20Mock", ["TestToken", "TT", 18]);
    const paillier = m.contract("Paillier");
    const discreteERC20 = m.contract("DiscreteERC20", ["DiscreteToken", "DTT", 18]);

    const wrapper = m.contract("DiscreteERC20Bridge", [
        erc20.address,
        discreteERC20.address,
        paillier.address,
    ]);

    return { erc20, paillier, discreteERC20, wrapper };
});

export default DiscreteERC20BridgeModule;
