import * as envConfig from "../env-config.json";
import logger from "../logger/winston";
import * as helperService from "./helperService";

export const validateWalletAddress = async (networkId: string, address: string): Promise<any> => {
  try {
    const web3 = helperService.getWeb3Instance(networkId)
    var isAddressValid = web3.utils.isAddress(address);
    if (!isAddressValid) {
      logger.info(`[validateWalletAddress];Address invalid ${address}`);

      return {
        success: false,
        message: "Address is invalid"
      };
    }

    return {
      success: true,
      message: "Address is valid"
    };
  } catch (error) {
    logger.error(`[validateWalletAddress];${error}`, error);

    return {
      success: false
    };
  }
};

export const getGasPrice = async (networkId: string): Promise<any> => {
  try {
    const web3 = helperService.getWeb3Instance(networkId)

    var gasPriceAmount = Number(
      web3.utils.fromWei(await web3.eth.getGasPrice(), "gwei")
    );

    var arrs = gasPriceAmount.toString().split(".");
    if (arrs.length > 1) {
      gasPriceAmount = parseInt(arrs[0]);
    }

    let estimatedGasPriceAmount = 0;
    if (networkId.toUpperCase() == 'POLYGON') {
      estimatedGasPriceAmount = gasPriceAmount > envConfig.polygonNetwork.gasPrice
        ? gasPriceAmount
        : envConfig.polygonNetwork.gasPrice;
    } else if ((networkId.toUpperCase() == 'OASY')) {
      estimatedGasPriceAmount = gasPriceAmount > envConfig.oasyNetwork.gasPrice
        ? gasPriceAmount
        : envConfig.oasyNetwork.gasPrice;
    } else if ((networkId.toUpperCase() == 'GOERLI')) {
      estimatedGasPriceAmount = gasPriceAmount > envConfig.goerli.gasPrice
        ? gasPriceAmount
        : envConfig.goerli.gasPrice;
    }

    const gasPrice = web3.utils
      .toWei(web3.utils.toBN(estimatedGasPriceAmount.toString()), "gwei")
      .toString();

    return gasPrice;
  } catch (error) {
    logger.error(`[getGasPrice];${error}`, error);
  }
};

export const getAddressBalance = async (networkId: string, address: string) => {
  try {
    const web3 = helperService.getWeb3Instance(networkId)
    let result = await web3.eth.getBalance(
      address,
    );

    var symbol = "";
    if (networkId.toUpperCase() == 'POLYGON') {
      symbol = 'MATIC';
    } else if ((networkId.toUpperCase() == 'OASY')) {
      symbol = 'OAS';
    } else if ((networkId.toUpperCase() == 'GOERLI')) {
      symbol = 'ETH';
    }

    return {
      success: true,
      symbol: symbol,
      balance: await web3.utils.fromWei(result),
      balanceInWei: result
    };
  } catch (error) {
    logger.error(`[getAddressBalance];${error}`, error);

    return {
      success: false,
      message: error,
    };
  }
}

export const createWallet = async (networkId: string) => {
  try {
    const web3 = helperService.getWeb3Instance(networkId)
    const account = web3.eth.accounts.create();

    logger.info(`[createWallet];Create a new account success address: ${account.address}`);
    return {
      address: account.address,
      privateKey: account.privateKey,
    };
  } catch (error) {
    logger.error(`[createWallet];${error}`, error);
    return {
      success: false,
      message: error,
    };
  }
}