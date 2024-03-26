import { ormconfig } from "../ormconfig"
import logger from "../logger/winston";
import { nftInfo } from "../entities/nftInfo.entity";
import { nftTrans } from "../entities/nftTrans.entity";
import { INftInfoModel } from "../models/nftInfo.model"
import { BaseResponse } from "../models/base.response"
import { UUID } from "crypto";
import { transactionType } from "../constants/constants";

const crypto = require('crypto');

export const addNewRecord = async (transType: string, nftInfoModel: INftInfoModel): Promise<BaseResponse> => {
    try {
        const nftInfoEntity = new nftInfo();
        nftInfoEntity.id = crypto.randomUUID();
        nftInfoEntity.user_id = nftInfoModel.user_id;
        nftInfoEntity.token_id = nftInfoModel.token_id;
        nftInfoEntity.token_metadata = nftInfoModel.token_metadata;
        nftInfoEntity.thumbnail = nftInfoModel.thumbnail;
        nftInfoEntity.network = nftInfoModel.network;
        nftInfoEntity.owner_address = nftInfoModel.from;
        nftInfoEntity.created_date = new Date();
        nftInfoEntity.is_burn = nftInfoModel.is_burn;
        nftInfoEntity.is_delete = false;
        nftInfoEntity.metadata_attr = nftInfoModel.metadata_attr;
        nftInfoEntity.modified_date = null;
        nftInfoEntity.nftTrans = null;
        nftInfoEntity.contract_address = nftInfoModel.contract_address;

        const nftTransEntity = new nftTrans();
        nftTransEntity.id = crypto.randomUUID();
        nftTransEntity.nft_info = nftInfoEntity;
        nftTransEntity.txhash = nftInfoModel.txhash;
        nftTransEntity.from = nftInfoModel.from;
        nftTransEntity.to = nftInfoModel.to;
        nftTransEntity.trans_type = transType;
        nftTransEntity.created_date = new Date();
        nftTransEntity.is_delete = false;
        nftTransEntity.modified_date = null;

        await ormconfig.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(nftInfoEntity);
            await transactionalEntityManager.save(nftTransEntity);
        });

        return {
            success: true,
            message: "Save NFT info to database is success",
            message_code: 200
        };
    } catch (error) {
        logger.error(`[addNewRecord];${error}`, error);

        return {
            success: false,
            message: "Faield to save NFT info to database",
            message_code: 400
        };
    }
};

export const updateTokenMetaData = async (nftInfoId: UUID, tokenMetaData: string, thumbnail: string): Promise<BaseResponse> => {
    try {
        const userRepository = ormconfig.getRepository(nftInfo);
        const nftInfoEntity = await userRepository.findOneBy({ id: nftInfoId });

        if (nftInfoEntity == undefined || nftInfoEntity == null) {
            return {
                success: false,
                message: "NFT record is not found",
                message_code: 400
            };
        }

        await userRepository.update(nftInfoId, {
            token_metadata: tokenMetaData,
            thumbnail: thumbnail
        });

        return {
            success: true,
            message: "Update NFT info to database is success",
            message_code: 200
        };
    } catch (error) {
        logger.error(`[updateTokenMetaData];${error}`, error);

        return {
            success: false,
            message: "Faield to update NFT info to database",
            message_code: 400
        };
    }
};

export const setBurn = async (tokenId: number,
    contractAddress: string,
    from: string,
    txhash: string): Promise<BaseResponse> => {
    try {
        const userRepository = ormconfig.getRepository(nftInfo);
        const nftInfoEntity = await userRepository.findOneBy({ token_id: tokenId, contract_address: contractAddress });

        if (nftInfoEntity == undefined || nftInfoEntity == null) {
            return {
                success: false,
                message: "NFT record is not found",
                message_code: 400
            };
        }

        nftInfoEntity.is_burn = true;

        const nftTransEntity = new nftTrans();
        nftTransEntity.id = crypto.randomUUID();
        nftTransEntity.nft_info = nftInfoEntity;
        nftTransEntity.txhash = txhash;
        nftTransEntity.from = from;
        nftTransEntity.to = '0x0000000000000000000000000000000000000000';
        nftTransEntity.trans_type = transactionType.burn;
        nftTransEntity.created_date = new Date();
        nftTransEntity.is_delete = false;
        nftTransEntity.modified_date = null;

        await ormconfig.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(nftTransEntity);
            await transactionalEntityManager.save(userRepository);
        });

        return {
            success: true,
            message: "Update NFT info to database is success",
            message_code: 200
        };
    } catch (error) {
        logger.error(`[updateTokenMetaData];${error}`, error);

        return {
            success: false,
            message: "Faield to update NFT info to database",
            message_code: 400
        };
    }
};

export const getRecordById = async (nftInfoId: UUID): Promise<nftInfo> => {
    try {
        const userRepository = ormconfig.getRepository(nftInfo);
        const nftInfoEntity = await userRepository.findOneBy({ id: nftInfoId });

        return nftInfoEntity;
    } catch (error) {
        logger.error(`[getRecordById];${error}`, error);

        return null;
    }
};

export const getNftByTxHash = async (txHash: string): Promise<any> => {
    try {
        const result = await ormconfig
            .getRepository(nftTrans)
            .createQueryBuilder('nftTrans')
            .leftJoinAndSelect("nftTrans.nft_info", "nftInfo")
            .where('nftTrans.txhash = :txHash', { txHash })
            .andWhere('nftTrans.is_delete = 0')
            .getOne();

        return {
            id: (result.nft_info as nftInfo).id,
            txhash: result.txhash,
            from: result.from,
            to: result.to,
            trans_type: result.trans_type,
            owner_address: (result.nft_info as nftInfo).owner_address,
            token_id: (result.nft_info as nftInfo).token_id,
            token_metadata: (result.nft_info as nftInfo).token_metadata,
            thumbnail: (result.nft_info as nftInfo).thumbnail,
            network: (result.nft_info as nftInfo).network,
            metadata_attr: (result.nft_info as nftInfo).metadata_attr,
            is_burn: (result.nft_info as nftInfo).is_burn,
            mintDate: (result.nft_info as nftInfo).created_date
        };
    } catch (error) {
        logger.error(`[getRecordByTxHash];${error}`, error);
        return null;
    }
};

export const getManyNftByOwnerAddress = async (ownerAddress: string, pageIndex: number, pageSize: number): Promise<any> => {
    try {
        const entities = await ormconfig
            .getRepository(nftInfo)
            .createQueryBuilder('nftInfo')
            .where('nftInfo.owner_address = :ownerAddress', { ownerAddress })
            .andWhere('nftInfo.is_delete = 0')
            .skip((pageIndex - 1) * pageSize)
            .take(pageSize)
            .getMany();

        const totalRecord = await ormconfig
            .getRepository(nftInfo)
            .createQueryBuilder("nftInfo")
            .where('nftInfo.owner_address = :ownerAddress', { ownerAddress })
            .andWhere('nftInfo.is_delete = 0')
            .getCount()

        let res = [];
        entities.forEach(record => {
            res.push({
                id: record.id,
                owner_address: record.owner_address,
                token_id: record.token_id,
                token_metadata: record.token_metadata,
                thumbnail: record.thumbnail,
                network: record.network,
                metadata_attr: record.metadata_attr,
                is_burn: record.is_burn,
                mintDate: record.created_date
            })
        });

        return {
            records: res,
            totalRecord: totalRecord
        };
    } catch (error) {
        logger.error(`[getNftByOwnerAddress];${error}`, error);
        return null;
    }
};