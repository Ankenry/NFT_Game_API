import logger from "../logger/winston";
import * as contractJsonMetadata from "../contractBuilds/contract-json-metadata.json";
import * as envConfig from "../env-config.json";

const Web3 = require("web3");

export const getNetworkIdFromReqHeader = (req: Request): string => {
  try {
    if (req == null || req == undefined) {
      return "";
    }

    var networkId = req.headers["network_id"];
    if (networkId == null || networkId == undefined) {
      return "";
    }

    return networkId.toUpperCase();
  } catch (error) {
    logger.error(`[getNetworkIdFromReqHeader] ${error}`, error);
    return "";
  }
};

export const getSmartContract = (networkId: string) => {
  try {
    const web3 = getWeb3Instance(networkId);
    let contract = null;

    var runMode = '';
    if (process.env.NODE_ENV == 'development') {
      runMode = 'development';
    }
    else if (process.env.NODE_ENV == 'production') {
      runMode = 'production';
    }

    var contracts = contractJsonMetadata[runMode];
    var contractInfo = contracts.find(s => s.network == networkId.toUpperCase() && s.type == 'ERC721');
    if (contractInfo == undefined || contractInfo == null) {
      return null;
    }

    contract = new web3.eth.Contract(contractInfo.abiCode, contractInfo.smartContractAddress);
    return contract;
  } catch (error) {
    logger.error(`getSmartContract`, error);
  }
}

export const getErc1155SmartContract = (networkId: string) => {
  try {
    const web3 = getWeb3Instance(networkId);
    let contract = null;

    var runMode = '';
    if (process.env.NODE_ENV == 'development') {
      runMode = 'development';
    }
    else if (process.env.NODE_ENV == 'production') {
      runMode = 'production';
    }

    var contracts = contractJsonMetadata[runMode];
    var contractInfo = contracts.find(s => s.network == networkId.toUpperCase() && s.type == 'ERC1155');
    if (contractInfo == undefined || contractInfo == null) {
      return null;
    }

    contract = new web3.eth.Contract(contractInfo.abiCode, contractInfo.smartContractAddress);
    return contract;
  } catch (error) {
    logger.error(`getSmartContract`, error);
  }
}

export const getWeb3Instance = (networkId: string) => {
  let web3 = null;
  if (networkId.toUpperCase() == 'POLYGON') {
    web3 = new Web3(envConfig.polygonNetwork.rpc);
  } else if ((networkId.toUpperCase() == 'OASY')) {
    web3 = new Web3(envConfig.oasyNetwork.rpc);
  } else if ((networkId.toUpperCase() == 'GOERLI')) {
    web3 = new Web3(envConfig.goerli.rpc);
  }

  return web3;
}