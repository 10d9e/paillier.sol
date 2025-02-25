import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';

//import 'hardhat-circom';

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
      gasPrice: 1000000000,
    },
    // for testnet
    //'sepolia': {
    //  url: 'https://sepolia.base.org',
    //  accounts: [process.env.WALLET_KEY as string],
    //gasPrice: 1000000000,
    //},
  },
};
export default config;
