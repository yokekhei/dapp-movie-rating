require('babel-register');
require('babel-polyfill');
require('dotenv').config();

module.exports = {
  networks: {
    private: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"  // Match any network id
    }
  },
  
  contracts_directory: './contracts/',
  contracts_build_directory: './abis/',
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
