import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';

require('@nomicfoundation/hardhat-chai-matchers');

const mnemonic: string =
  'adapt mosquito move limb mobile illegal tree voyage juice mosquito burger raise father hope layer';
const config: HardhatUserConfig = {
  solidity: '0.8.25',
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      accounts: {
        count: 10,
        mnemonic,
        path: "m/44'/60'/0'/0",
      },
    },
  },
};
export default config;
