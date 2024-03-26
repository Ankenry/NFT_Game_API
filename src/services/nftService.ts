
import { transactionType } from "../constants/constants";

import * as cryptoAccountService from "./cryptoAccountService";
import * as nftInfoRepository from "../repositories/nftInfoRepository";
import * as ipfsService from "./ipfsService";
import * as arweaveService from "./arweaveService";
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
    tokenMetaData: string,
    thumbnail: string,
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

        let contract = helperService.getSmartContract(networkId);
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
        const txData = await contract.methods.safeMint(receiveAddress, tokenMetaData).encodeABI()

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
                tokenId = web3.utils.hexToNumber(sendSignedTransactionRes.logs[0].topics[3]);
            }

            logger.info(`[mintNFT]: Mint NFT success txHash ${txRes.transactionHash} fromAccount: ${fromAccount.address} address: ${receiveAddress}} tokenMetaData: ${tokenMetaData}`);
            await nftInfoRepository.addNewRecord(transactionType.mint, {
                user_id: clientUserId,
                network: networkId,
                txhash: txRes.transactionHash,
                token_id: tokenId,
                token_metadata: tokenMetaData,
                thumbnail: thumbnail,
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
            logger.error(`[mintNFT]: Mint NFT error fromAccount: ${fromAccount.address} address: ${receiveAddress} error: ${error} tokenMetaData: ${tokenMetaData}`);
            return {
                success: false,
                txHash: txRes.transactionHash,
                error: `${error}`,
                message_code: 1001
            };
        }
    } catch (error) {
        logger.error(`[mintNFT]: Mint NFT error fromAccount: ${fromAccount.address} address: ${receiveAddress} error: ${error} tokenMetaData: ${tokenMetaData}`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1000
        };
    }
};

export const mintNftWithImage = async (networkId: string, nftMintModel: INftMintReqModel): Promise<GenericBaseResponse<INftMintResModel>> => {
    const web3 = helperService.getWeb3Instance(networkId);
    let fromAccount
    try {
        fromAccount = await web3.eth.accounts.privateKeyToAccount(nftMintModel.owerPrivateKey);
    } catch (error) {
        logger.error(`error`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: -1,
            data: null
        };
    }

    try {
        var isAddressValid = web3.utils.isAddress(nftMintModel.receiveAddress);
        if (!isAddressValid) {
            return {
                success: false,
                message: "Address invalid",
                message_code: -1,
                data: null
            };
        }

        let contract = helperService.getSmartContract(networkId);
        if (contract == null) {
            return {
                success: false,
                message: `Smart contract for network [${networkId}] is not found`,
                message_code: -1,
                data: null
            };
        }

        let parsedAttributes;
        try {
            parsedAttributes = JSON.parse(nftMintModel.attributes);
        } catch (error) {
            return {
                success: false,
                message: "Invalid JSON format in attributes",
                message_code: -1,
                data: null
            };
        }

        var uploadRes = await ipfsService.uploadToIpfs(
            nftMintModel.name,
            nftMintModel.description,
            nftMintModel.thumbnail,
            parsedAttributes,
            nftMintModel.external_url
        );

        if (!uploadRes.success) {
            return {
                success: false,
                message: `Upload to IPFS failed ${uploadRes.message}`,
                message_code: uploadRes.message_code,
                data: null
            };;
        }

        const gasprice = await web3.eth.getGasPrice();
        var count = await web3.eth.getTransactionCount(fromAccount.address);
        const txData = await contract.methods.safeMint(nftMintModel.receiveAddress, uploadRes.data.ipfsMetadataUrl).encodeABI()

        const txObject = {
            from: fromAccount.address,
            nonce: "0x" + count.toString(16),
            to: contract._address,
            gas: 2300000,
            value: "0x0",
            data: txData,
            gasPrice: gasprice
        }

        var txRes = await web3.eth.accounts.signTransaction(txObject, nftMintModel.owerPrivateKey);
        const raw = txRes.rawTransaction;
        try {
            var sendSignedTransactionRes = await web3.eth.sendSignedTransaction(raw);
            var tokenId = 0;
            if (sendSignedTransactionRes
                && sendSignedTransactionRes.logs && sendSignedTransactionRes.logs.length > 0
                && sendSignedTransactionRes.logs[0].topics && sendSignedTransactionRes.logs[0].topics.length >= 3) {
                tokenId = web3.utils.hexToNumber(sendSignedTransactionRes.logs[0].topics[3]);
            }

            logger.info(`[mintNFT]: Mint NFT success txHash ${txRes.transactionHash} fromAccount: ${fromAccount.address} address: ${nftMintModel.receiveAddress}}`);
            await nftInfoRepository.addNewRecord(transactionType.mint, {
                user_id: nftMintModel.clientUserId,
                network: networkId,
                txhash: txRes.transactionHash,
                token_id: tokenId,
                token_metadata: uploadRes.data.ipfsMetadataUrl,
                thumbnail: uploadRes.data.ipfsThumbnailUrl,
                from: fromAccount.address,
                to: nftMintModel.receiveAddress,
                is_burn: false,
                metadata_attr: nftMintModel.attributes,
                contract_address: contract._address
            });

            return {
                success: true,
                message: "Mint NFT successfully",
                message_code: 1,
                data: {
                    txHash: txRes.transactionHash,
                    tokenId: tokenId,
                    tokenMetadata: uploadRes.data.ipfsMetadataUrl,
                    thumbnail: uploadRes.data.ipfsThumbnailUrl
                }
            };
        } catch (error) {
            logger.error(`[mintNFT]: Mint NFT error fromAccount: ${fromAccount.address} address: ${nftMintModel.receiveAddress} error: ${error}`);
            return {
                success: false,
                message: "An error occurs",
                message_code: -1,
                data: {
                    txHash: txRes.transactionHash,
                    tokenId: null,
                    tokenMetadata: null,
                    thumbnail: null
                }
            };
        }
    } catch (error) {
        logger.error(`[mintNFT]: Mint NFT error fromAccount: ${fromAccount.address} address: ${nftMintModel.receiveAddress} error: ${error}`);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: -1,
            data: null
        };
    }
};

export const getNFTInfo = async (networkId: string, txHash: string): Promise<any> => {
    try {
        const web3 = helperService.getWeb3Instance(networkId);
        var transaction = await web3.eth.getTransactionReceipt(txHash);
        if (transaction == null) {
            logger.info(`[getNFTInfo];Transaction is not found txHash: ${txHash}`);
            return {
                success: false,
                message: "Transaction is not found"
            };
        }

        return {
            success: true,
            tokenId: web3.utils.hexToNumber(transaction?.logs?.[0]?.topics?.[3] ?? 0),
            from: transaction?.from,
            to: transaction?.to,
            txHash,
            gasUsed: scientificToDecimal(transaction.gasUsed * transaction.effectiveGasPrice / 1000000000000000000)
        };
    } catch (error) {
        logger.error(`[getNFTInfo];${error}`, error);
        return {
            success: false,
            message: error,
        };
    }
};

export const getNFTInfoInDatabase = async (txHash: string): Promise<any> => {
    try {
        const nftInfoEntity = await nftInfoRepository.getNftByTxHash(txHash);
        if (nftInfoEntity == undefined || nftInfoEntity == null) {
            return {
                success: false,
                message: "NFT record is not found",
                message_code: 400
            };
        }

        return {
            success: true,
            data: nftInfoEntity
        };
    } catch (error) {
        logger.error(`[getNFTInfo];${error}`, error);
        return {
            success: false,
            message: error,
        };
    }
};

export const updateTokenMetaData = async (networkId: string,
    owerPrivateKey: string,
    nftInfoId: UUID,
    tokenMetaData: string,
    thumbnail: string
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
        const nftInfoEntity = await nftInfoRepository.getRecordById(nftInfoId);
        if (nftInfoEntity == undefined || nftInfoEntity == null) {
            return {
                success: false,
                message: "NFT record is not found",
                message_code: 400
            };
        }

        let contract = helperService.getSmartContract(networkId);
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

        const tokenId = nftInfoEntity.token_id;
        const txData = await contract.methods.updateNftTokenUri(tokenId, tokenMetaData).encodeABI()

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
        try {
            await nftInfoRepository.updateTokenMetaData(nftInfoId, tokenMetaData, thumbnail);

            return {
                success: true,
                txHash: txRes.transactionHash,
                tokenId: tokenId
            };
        } catch (error) {
            logger.error(`[updateTokenMetaData]: fromAccount: ${fromAccount.address} error: ${error}`);
            return {
                success: false,
                txHash: txRes.transactionHash,
                error: `${error}`,
                message_code: 1001
            };
        }
    } catch (error) {
        logger.error(`[updateTokenMetaData]: fromAccount: ${fromAccount.address} error: ${error}`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1000
        };
    }
};

function scientificToDecimal(num) {
    const sign = Math.sign(num);

    //if the number is in scientific notation remove it
    if (/\d+\.?\d*e[\+\-]*\d+/i.test(num)) {
        const zero = '0';
        const parts = String(num).toLowerCase().split('e'); //split into coeff and exponent
        const e = parseInt(parts.pop()); //store the exponential part
        let l = Math.abs(e); //get the number of zeros
        const direction = e / l; // use to determine the zeroes on the left or right
        const coeff_array = [];

        for (let index = 0; index < parts[0].split('.').length; index++) {
            const element = parts[0].split('.')[index];
            coeff_array.push(parseInt(element));
        }


        if (direction === -1) {
            coeff_array[0] = Math.abs(coeff_array[0]);
            num = zero + '.' + new Array(l).join(zero) + coeff_array.join('');
        }
        else {
            const dec = coeff_array[1];
            if (dec) l = l - dec.length;
            num = coeff_array.join('') + new Array(l + 1).join(zero);
        }
    }

    if (sign < 0) {
        num = -num;
    }

    return num;
}

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

export const transferNft = async (networkId: string,
    owerPrivateKey: string,
    receiveAddress: string,
    tokenId: number
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

        let contract = helperService.getSmartContract(networkId);
        if (contract == null) {
            return {
                success: false,
                message: `Smart contract for network [${networkId}] is not found`,
                message_code: -1,
                data: null
            };
        }

        var count = await web3.eth.getTransactionCount(fromAccount.address);
        const txData = await contract.methods.transferFrom(fromAccount.address, receiveAddress, tokenId).encodeABI()
        const gasprice = await web3.eth.getGasPrice();

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
                tokenId = web3.utils.hexToNumber(sendSignedTransactionRes.logs[0].topics[3]);
            }

            return {
                success: true,
                txHash: txRes.transactionHash,
                tokenId: tokenId
            };
        } catch (error) {
            logger.error(`[transferNft]: fromAccount: ${fromAccount.address} address: ${receiveAddress} tokenId: ${tokenId}`, error);
            return {
                success: false,
                txHash: txRes.transactionHash,
                error: `${error}`,
                message_code: 1001
            };
        }
    } catch (error) {
        logger.error(`[transferNft]: fromAccount: ${fromAccount.address} address: ${receiveAddress} tokenId: ${tokenId}`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1000
        };
    }
};

export const burnNft = async (networkId: string, owerPrivateKey: string, tokenId: number): Promise<any> => {
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
        let contract = helperService.getSmartContract(networkId);
        if (contract == null) {
            return {
                success: false,
                message: `Smart contract for network [${networkId}] is not found`,
                message_code: -1,
                data: null
            };
        }

        var count = await web3.eth.getTransactionCount(fromAccount.address);
        const txData = await contract.methods.burn(tokenId).encodeABI()
        const gasprice = await web3.eth.getGasPrice();

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
        var sendSignedTransactionRes = await web3.eth.sendSignedTransaction(raw);
        var tokenId = 0;
        if (sendSignedTransactionRes
            && sendSignedTransactionRes.logs && sendSignedTransactionRes.logs.length > 0
            && sendSignedTransactionRes.logs[0].topics && sendSignedTransactionRes.logs[0].topics.length >= 3) {
            tokenId = web3.utils.hexToNumber(sendSignedTransactionRes.logs[0].topics[3]);

            await nftInfoRepository.setBurn(tokenId, contract._address, fromAccount.address, txRes.transactionHash);
        }

        return {
            success: true,
            txHash: txRes.transactionHash,
            tokenId: tokenId
        };
    } catch (error) {
        logger.error(`[burnNft]: fromAccount: ${fromAccount.address} tokenId: ${tokenId}`, error);
        return {
            success: false,
            message: error?.message ?? error,
            message_code: 1000
        };
    }
};

export const getManyNftByOwnerAddress = async (ownerAddress: string, pageIndex: number, pageSize: number): Promise<any> => {
    try {
        const nftEntities = await nftInfoRepository.getManyNftByOwnerAddress(ownerAddress, pageIndex, pageSize);
        if (nftEntities == undefined || nftEntities == null) {
            return {
                success: false,
                message: "NFT record is not found",
                message_code: 400
            };
        }

        return {
            success: true,
            data: nftEntities
        };
    } catch (error) {
        logger.error(`[getManyNftByOwnerAddress];${error}`, error);
        return {
            success: false,
            message: error,
        };
    }
};