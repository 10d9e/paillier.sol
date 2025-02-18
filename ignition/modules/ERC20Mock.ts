import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ERC20MockModule", (m) => {
    const name = "MockToken";
    const symbol = "MTK";
    const decimals = 18;

    const erc20Mock = m.contract("ERC20Mock", [name, symbol, decimals]);

    return { erc20Mock };
});
