
import { transactionType } from "../constants/constants";

import * as cryptoAccountService from "./cryptoAccountService";
import * as nftInfoRepository from "../repositories/nftInfoRepository";
import * as ipfsService from "./ipfsService";
import * as helperService from "./helperService";

import logger from "../logger/winston";
import { UUID } from "crypto";

import { INftMintReqModel, INftMintResModel } from "../models/nft.model"
import { BaseResponse, GenericBaseResponse } from "../models/base.response"

export const checkEstimateGasForMint = async (networkId: string, address: string) => {
    try {
        const web3 = helperService.getWeb3Instance(networkId);

        var balanceInWei = await web3.eth.getBalance(address);
        var estimateGasRes = await estimateGasLimitForMintNft(networkId, address, 'tokenMetaData');
        return {
            success: true,
            isEnoughBalance: !(web3.utils.fromWei(balanceInWei) < estimateGasRes.gasInEth),
            message: web3.utils.fromWei(balanceInWei) < estimateGasRes.gasInEth ? "Insufficient balance" : "Enough balance for estimate gas",
            gasLimit: estimateGasRes.gasLimit,
            gasPrice: estimateGasRes.gasPrice,
            gasInEth: estimateGasRes.gasInEth
        };
    }
    catch (error) {
        logger.error(`[checkEstimateGas];${error}`, error);
        return {
            success: false,
            message: error?.message ?? error,
        };
    }
}

export const mintNft = async (networkId: string,
    owerPrivateKey: string,
    receiveAddress: string,
    id: string,
    amount: number,
    clientUserId: number
): Promise<any> => {
    const web3 = helperService.getWeb3Instance(networkId);
    let fromAccount
    try {
        fromAccount = await web3.eth.accounts.privateKeyToAccount(owerPrivateKey);
    } catch (error) {
        logger.error(`error`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1001
        };
    }

    try {
        var isAddressValid = web3.utils.isAddress(receiveAddress);
        if (!isAddressValid) {
            return {
                success: false,
                message: "Address invalid"
            };
        }

        let contract = helperService.getErc1155SmartContract(networkId);
        if (contract == null) {
            return {
                success: false,
                message: `Smart contract for network [${networkId}] is not found`,
                message_code: -1,
                data: null
            };
        }

        const gasprice = await web3.eth.getGasPrice();
        var count = await web3.eth.getTransactionCount(fromAccount.address);
        const txData = await contract.methods.mint(receiveAddress, id, amount, "0x").encodeABI()

        const txObject = {
            from: fromAccount.address,
            nonce: "0x" + count.toString(16),
            to: contract._address,
            gas: 2300000,
            value: "0x0",
            data: txData,
            gasPrice: gasprice
        }

        var txRes = await web3.eth.accounts.signTransaction(txObject, owerPrivateKey);
        const raw = txRes.rawTransaction;
        try {
            var sendSignedTransactionRes = await web3.eth.sendSignedTransaction(raw);
            var tokenId = 0;
            if (sendSignedTransactionRes
                && sendSignedTransactionRes.logs && sendSignedTransactionRes.logs.length > 0
                && sendSignedTransactionRes.logs[0].topics && sendSignedTransactionRes.logs[0].topics.length >= 3) {
                try {
                    tokenId = web3.utils.hexToNumber(sendSignedTransactionRes.logs[0].topics[3]);
                } catch (error) {

                }
            }

            logger.info(`[mintNFT]: Mint NFT success txHash ${txRes.transactionHash} fromAccount: ${fromAccount.address} address: ${receiveAddress}}`);
            await nftInfoRepository.addNewRecord(transactionType.mint, {
                user_id: clientUserId,
                network: networkId,
                txhash: txRes.transactionHash,
                token_id: tokenId,
                token_metadata: null,
                thumbnail: null,
                from: fromAccount.address,
                to: receiveAddress,
                is_burn: false,
                metadata_attr: null,
                contract_address: contract._address
            });

            return {
                success: true,
                txHash: txRes.transactionHash,
                tokenId: tokenId
            };
        } catch (error) {
            logger.error(`[mintNFT]: Mint NFT error fromAccount: ${fromAccount.address} address: ${receiveAddress} error: ${error}`);
            return {
                success: false,
                txHash: txRes.transactionHash,
                error: `${error}`,
                message_code: 1001
            };
        }
    } catch (error) {
        logger.error(`[mintNFT]: Mint NFT error fromAccount: ${fromAccount.address} address: ${receiveAddress} error: ${error}`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1000
        };
    }
};

export const setBaseUri = async (networkId: string,
    owerPrivateKey: string,
    baseUri: string
): Promise<any> => {
    const web3 = helperService.getWeb3Instance(networkId);
    let fromAccount
    try {
        fromAccount = await web3.eth.accounts.privateKeyToAccount(owerPrivateKey);
    } catch (error) {
        logger.error(`error`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1001
        };
    }

    try {
        let contract = helperService.getErc1155SmartContract(networkId);
        if (contract == null) {
            return {
                success: false,
                message: `Smart contract for network [${networkId}] is not found`,
                message_code: -1,
                data: null
            };
        }

        const gasprice = await web3.eth.getGasPrice();
        var count = await web3.eth.getTransactionCount(fromAccount.address);
        const txData = await contract.methods.setBaseUri(baseUri).encodeABI()

        const txObject = {
            from: fromAccount.address,
            nonce: "0x" + count.toString(16),
            to: contract._address,
            gas: 2300000,
            value: "0x0",
            data: txData,
            gasPrice: gasprice
        }

        var txRes = await web3.eth.accounts.signTransaction(txObject, owerPrivateKey);
        const raw = txRes.rawTransaction;
        try {
            var sendSignedTransactionRes = await web3.eth.sendSignedTransaction(raw);
            return {
                success: true,
                txHash: txRes.transactionHash,
            };
        } catch (error) {
            logger.error(`[setBaseUri]: error: ${error}`);
            return {
                success: false,
                txHash: txRes.transactionHash,
                error: `${error}`,
                message_code: 1001
            };
        }
    } catch (error) {
        logger.error(`[mintNFT]: error`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1000
        };
    }
};

export const burnNft = async (networkId: string,
    owerPrivateKey: string,
    receiveAddress: string,
    id: string,
    amount: number,
    clientUserId: number
): Promise<any> => {
    const web3 = helperService.getWeb3Instance(networkId);
    let fromAccount
    try {
        fromAccount = await web3.eth.accounts.privateKeyToAccount(owerPrivateKey);
    } catch (error) {
        logger.error(`error`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1001
        };
    }

    try {
        var isAddressValid = web3.utils.isAddress(receiveAddress);
        if (!isAddressValid) {
            return {
                success: false,
                message: "Address invalid"
            };
        }

        let contract = helperService.getErc1155SmartContract(networkId);
        if (contract == null) {
            return {
                success: false,
                message: `Smart contract for network [${networkId}] is not found`,
                message_code: -1,
                data: null
            };
        }

        const gasprice = await web3.eth.getGasPrice();
        var count = await web3.eth.getTransactionCount(fromAccount.address);
        const txData = await contract.methods.burn(receiveAddress, id, amount).encodeABI()

        const txObject = {
            from: fromAccount.address,
            nonce: "0x" + count.toString(16),
            to: contract._address,
            gas: 2300000,
            value: "0x0",
            data: txData,
            gasPrice: gasprice
        }

        var txRes = await web3.eth.accounts.signTransaction(txObject, owerPrivateKey);
        const raw = txRes.rawTransaction;
        try {
            var sendSignedTransactionRes = await web3.eth.sendSignedTransaction(raw);

            logger.info(`[burnNft]: Burn NFT success txHash ${txRes.transactionHash} fromAccount: ${fromAccount.address} address: ${receiveAddress}}`);
            await nftInfoRepository.addNewRecord(transactionType.mint, {
                user_id: clientUserId,
                network: networkId,
                txhash: txRes.transactionHash,
                token_id: 0,
                token_metadata: null,
                thumbnail: null,
                from: fromAccount.address,
                to: receiveAddress,
                is_burn: true,
                metadata_attr: null,
                contract_address: contract._address
            });

            return {
                success: true,
                txHash: txRes.transactionHash,
                tokenId: 0
            };
        } catch (error) {
            logger.error(`[burnNft]: Burn NFT error fromAccount: ${fromAccount.address} address: ${receiveAddress} error: ${error}`);
            return {
                success: false,
                txHash: txRes.transactionHash,
                error: `${error}`,
                message_code: 1001
            };
        }
    } catch (error) {
        logger.error(`[burnNft]: Burn NFT error fromAccount: ${fromAccount.address} address: ${receiveAddress} error: ${error}`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1000
        };
    }
};

export const estimateGasLimitForMintNft = async (
    networkId: string,
    recipient: string,
    tokenMetaData: string
): Promise<any> => {
    const contract = helperService.getSmartContract(networkId);
    var gasLimit = await contract.methods
        .safeMint(recipient, tokenMetaData)
        .estimateGas();

    console.log(`estimateGasLimitForMintNft`, gasLimit);

    var totalGasLimit = gasLimit + parseInt(((gasLimit * 60) / 100).toFixed(0));
    var gasPrice = await cryptoAccountService.getGasPrice(networkId);
    var gasInEth = (gasPrice * totalGasLimit) / 1000000000000000000;

    return {
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        gasInEth: gasInEth
    };
};