import { ormconfig } from "../ormconfig"
import logger from "../logger/winston";
import { nftGame } from "../entities/nftGame.entity";
import { nftPackRarityRate } from "../entities/nftPackRarityRate.entity";
import { userNftPack } from "../entities/userNftPack.entity";
import { userNft } from "../entities/userNft.entity";
import { nftPack } from "../entities/nftPack.entity";
import { nftPackItemFrequency } from "../entities/nftPackItemFrequency.entity";
import { nftItem } from "../entities/nftItem.entity";
import { nftCompound } from "../entities/nftCompound.entity";
const moment = require('moment');

export const getNftGame = async (page_index: number, page_size: number): Promise<any> => {
  try {
    const entities = await ormconfig
      .getRepository(nftGame)
      .createQueryBuilder('nftGame')
      .where('nftGame.activation = 1')
      .andWhere('nftGame.is_delete = 0')
      .skip((page_index - 1) * page_size)
      .take(page_size)
      .getMany();

    const totalRecord = await ormconfig
      .getRepository(nftGame)
      .createQueryBuilder('nftGame')
      .where('nftGame.activation = 1')
      .andWhere('nftGame.is_delete = 0')
      .getCount()

    var gameRes = [];
    for (let i = 0; i < entities.length; i++) {
      const game = entities[i];
      gameRes.push({
        id: game.id,
        fullname: game.fullname,
        description: game.description,
        thumbnail: game.thumbnail,
        ref_game_id: game.ref_game_id,
        ref_url: game.ref_url
      })
    }

    return {
      success: true,
      data: {
        records: gameRes,
        totalRecord: totalRecord
      }
    };
  } catch (error) {
    logger.error(`[getNftGame];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const getNftGameById = async (game_id: string): Promise<any> => {
  try {
    const game = await ormconfig
      .getRepository(nftGame)
      .createQueryBuilder('nftGame')
      .where('nftGame.activation = 1')
      .andWhere('nftGame.is_delete = 0')
      .andWhere('nftGame.id = (:game_id)', { game_id: game_id })
      .getOne();

    return {
      success: true,
      records: {
        id: game.id,
        fullname: game.fullname,
        description: game.description,
        thumbnail: game.thumbnail,
        ref_game_id: game.ref_game_id,
        ref_url: game.ref_url
      },
    };
  } catch (error) {
    logger.error(`[getNftGameById];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const openNftPack = async (game_id: string, user_id: number, nft_pack_id: string): Promise<any> => {
  try {
    const userNftPackEnties = await ormconfig
      .getRepository(userNftPack)
      .createQueryBuilder('userNftPack')
      .innerJoinAndSelect('userNftPack.nft_pack', 'nft_pack')
      .where('userNftPack.activation = 1')
      .andWhere('userNftPack.is_delete = 0')
      .andWhere('nft_pack.activation = 1')
      .andWhere('nft_pack.is_delete = 0')
      .andWhere('nft_pack.nft_game_id = :game_id', { game_id: game_id })
      .andWhere('nft_pack.id = :nft_pack_id', { nft_pack_id: nft_pack_id })
      .andWhere('userNftPack.user_id = :user_id', { user_id })
      .getOne();

    if (userNftPackEnties == null) {
      return {
        success: false,
        message: "NFT pack does not exsits"
      };
    }

    // Get random a nft_pack_rarity_rates
    const nftPackItemFrequencyEntity = await ormconfig
      .getRepository(nftPackItemFrequency)
      .createQueryBuilder('nftPackItemFrequency')
      .where('nftPackItemFrequency.activation = 1')
      .andWhere('nftPackItemFrequency.is_delete = 0')
      .andWhere('nftPackItemFrequency.nft_pack_id = :nft_pack_id', { nft_pack_id: nft_pack_id })
      .orderBy('RAND() * nftPackItemFrequency.frequency', 'DESC')
      .getOne();

    if (nftPackItemFrequencyEntity == null) {
      return {
        success: false,
        message: "NFT item does not exsits"
      };
    }

    // TODO: Transfer NFT to user

    // Save NFT item to database
    const userNftEntity = new userNft();
    userNftEntity.nft_item = nftPackItemFrequencyEntity.nft_item;
    userNftEntity.user_id = user_id;
    userNftEntity.activation = true;
    userNftEntity.status = "NEW";
    userNftEntity.is_delete = false;
    userNftEntity.created_date = moment().utc().format();

    const entityManager = ormconfig.createEntityManager();
    await entityManager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(userNft, userNftEntity);
    });

    return {
      success: true,
      message: "Open NFT pack successfully",
      data: {
        records: nftPackItemFrequencyEntity
      }
    };
  } catch (error) {
    logger.error(`[openNftPack];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const assignNftPackToUser = async (game_id: string, user_id: number): Promise<any> => {
  try {
    // Get random a nft_pack_rarity_rates
    const nftPackRarityRateEntity = await ormconfig
      .getRepository(nftPackRarityRate)
      .createQueryBuilder('nftPackRarityRate')
      .innerJoinAndSelect('nftPackRarityRate.nft_pack', 'nft_pack')
      .where('nftPackRarityRate.activation = 1')
      .andWhere('nftPackRarityRate.is_delete = 0')
      .andWhere('nft_pack.is_delete = 0')
      .andWhere('nft_pack.activation = 1')
      .andWhere('nft_pack.nft_game_id = :game_id', { game_id: game_id })
      .andWhere('nft_pack.remain_count > 0')
      .orderBy('RAND() * (1 / (nftPackRarityRate.rarity * nftPackRarityRate.rate))')
      .getOne();

    if (nftPackRarityRateEntity == null) {
      return {
        success: false,
        message: "NFT pack not found",
      };
    }

    const entityManager = ormconfig.createEntityManager();
    const userNftPackEntity = new userNftPack();
    userNftPackEntity.nft_pack = nftPackRarityRateEntity.nft_pack;
    userNftPackEntity.user_id = user_id;
    userNftPackEntity.activation = true;
    userNftPackEntity.status = "NEW";
    userNftPackEntity.is_delete = false;
    userNftPackEntity.created_date = moment().utc().format();

    await entityManager.transaction(async transactionalEntityManager => {
      await transactionalEntityManager.save(userNftPack, userNftPackEntity);
      await transactionalEntityManager.update(nftPack, nftPackRarityRateEntity.nft_pack.id, { remain_count: nftPackRarityRateEntity.nft_pack.remain_count - 1 });
    });

    return {
      success: true,
      message: "Assign NFT pack to user successfully",
      data: {
        user_nft_pack_id: userNftPackEntity.id,
        nft_pack_id: nftPackRarityRateEntity.nft_pack.id
      }
    };
  } catch (error) {
    logger.error(`[openNftPack];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const getPackByUserId = async (game_id: string, user_id: number, page_index: number, page_size: number): Promise<any> => {
  try {
    if (page_index === undefined) {
      page_index = 1;
    }
    if (page_size === undefined) {
      page_size = 10;
    }

    const userNftPackEnties = await ormconfig
      .getRepository(userNftPack)
      .createQueryBuilder('userNftPack')
      .innerJoinAndSelect('userNftPack.nft_pack', 'nft_pack')
      .where('userNftPack.activation = 1')
      .andWhere('userNftPack.is_delete = 0')
      .andWhere('nft_pack.activation = 1')
      .andWhere('nft_pack.is_delete = 0')
      .andWhere('nft_pack.nft_game_id = :game_id', { game_id: game_id })
      .andWhere('userNftPack.user_id = :user_id', { user_id })
      .skip((page_index - 1) * page_size)
      .take(page_size)
      .getMany();

    const totalRecord = await ormconfig
      .getRepository(userNftPack)
      .createQueryBuilder('userNftPack')
      .innerJoinAndSelect('userNftPack.nft_pack', 'nft_pack')
      .where('userNftPack.activation = 1')
      .andWhere('userNftPack.is_delete = 0')
      .andWhere('nft_pack.activation = 1')
      .andWhere('nft_pack.is_delete = 0')
      .andWhere('nft_pack.nft_game_id = :game_id', { game_id: game_id })
      .andWhere('userNftPack.user_id = :user_id', { user_id })
      .getCount()

    var records = [];
    for (let i = 0; i < userNftPackEnties.length; i++) {
      const userNftPack = userNftPackEnties[i];
      records.push({
        id: userNftPack.id,
        created_date: userNftPack.created_date,
        status: userNftPack.status,
        fullname: userNftPack.nft_pack.fullname,
        description: userNftPack.nft_pack.description,
        thumbnail: userNftPack.nft_pack.thumbnail,
        inclusion_count: userNftPack.nft_pack.inclusion_count
      });
    }

    return {
      success: true,
      data: {
        records: records,
        totalRecord: totalRecord
      }
    };
  } catch (error) {
    logger.error(`[getPackByUserId];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const getNftByUserId = async (game_id: string, user_id: number, page_index: number, page_size: number): Promise<any> => {
  try {
    if (page_index === undefined) {
      page_index = 1;
    }
    if (page_size === undefined) {
      page_size = 10;
    }

    const userNftEnties = await ormconfig
      .getRepository(userNft)
      .createQueryBuilder('userNft')
      .innerJoinAndSelect('userNft.nft_item', 'nft_item')
      .where('userNft.activation = 1')
      .andWhere('userNft.is_delete = 0')
      .andWhere('nft_item.activation = 1')
      .andWhere('nft_item.is_delete = 0')
      .andWhere('nft_item.nft_game_id = :game_id', { game_id })
      .andWhere('userNft.user_id = :user_id', { user_id })
      .skip((page_index - 1) * page_size)
      .take(page_size)
      .getMany();

    const totalRecord = await ormconfig
      .getRepository(userNft)
      .createQueryBuilder('userNft')
      .innerJoinAndSelect('userNft.nft_item', 'nft_item')
      .where('userNft.activation = 1')
      .andWhere('userNft.is_delete = 0')
      .andWhere('nft_item.activation = 1')
      .andWhere('nft_item.is_delete = 0')
      .andWhere('nft_item.nft_game_id = :game_id', { game_id })
      .andWhere('userNft.user_id = :user_id', { user_id })
      .getCount()

    var records = [];
    for (let i = 0; i < userNftEnties.length; i++) {
      const userNft = userNftEnties[i];
      records.push({
        id: userNft.id,
        created_date: userNft.created_date,
        status: userNft.nft_item.status,
        // status: "NEW",
        rarity: userNft.nft_item.rarity,
        thumbnail_url: userNft.nft_item.thumbnail_url,
        metadata_url: userNft.nft_item.metadata_url,
        name: userNft.nft_item.name,
        description: userNft.nft_item.description
      });
    }

    return {
      success: true,
      data: {
        records: records,
        totalRecord: totalRecord
      }
    };
  } catch (error) {
    logger.error(`[getPackByUserId];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const getNftByPackId = async (pack_id: number): Promise<any> => {
  try {
    const nftItem = await ormconfig
      .getRepository(nftPackItemFrequency)
      .createQueryBuilder('nft_pack_item_frequencies')
      .where('nft_pack_item_frequencies.activation = 1')
      .andWhere('nft_pack_item_frequencies.is_delete = 0')
      .andWhere('nft_pack_item_frequencies.nft_pack_id = (:pack_id)', { pack_id: pack_id })
      .getMany();
    // console.log(nftItem);

    var records = [];
    for (let i = 0; i < nftItem.length; i++) {
      const itemID = nftItem[i].id;
      records.push(Number(itemID));
    }
    const randomItem = records[Math.floor(Math.random() * records.length)];

    return {
      success: true,
      // nft_item_id:1,//randomItem
      nft_item_id: randomItem,
    };
  } catch (error) {
    logger.error(`[getNftByPackId];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const getNftItemById = async (nft_id: number): Promise<any> => {
  try {
    const nft_Item = await ormconfig
      .getRepository(nftItem)
      .createQueryBuilder('nft_items')
      .where('nft_items.activation = 1')
      .andWhere('nft_items.is_delete = 0')
      .andWhere('nft_items.id = (:nft_id)', { nft_id: nft_id })
      .getOne();

    return {
      success: true,
      data: {
        id: nft_Item.id,
        name: nft_Item.name,
        rarity: nft_Item.rarity,
        thumbnail: nft_Item.thumbnail_url,
        metadata_url: nft_Item.metadata_url,
        status: nft_Item.status,
        description: nft_Item.description
      },
    };
  } catch (error) {
    logger.error(`[getNftItemById];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};

export const getCompoundByGameId = async (game_id: string): Promise<any> => {
  try {
    const nftCompundEnties = await ormconfig
      .getRepository(nftCompound)
      .createQueryBuilder('nftCompound')
      .innerJoinAndSelect('nftCompound.nft_item', 'nft_item')
      .innerJoinAndSelect('nftCompound.burn_nft_item', 'burn_nft_item')
      .where('nftCompound.activation = 1')
      .andWhere('nftCompound.is_delete = 0')
      .andWhere('nft_item.is_delete = 0')
      .andWhere('nft_item.activation = 1')
      .andWhere('nft_item.nft_game_id = :game_id', { game_id: game_id })
      .andWhere('burn_nft_item.is_delete = 0')
      .andWhere('burn_nft_item.activation = 1')
      .andWhere('burn_nft_item.nft_game_id = :game_id', { game_id: game_id })
      .getMany();

    if (nftCompundEnties == undefined || nftCompundEnties == null) {
      return {
        success: false,
        message: "No compound found"
      };
    }

    const groupedResults = nftCompundEnties.reduce((groups, item) => {
      const nftId = item.nft_item.id;
      if (!groups[nftId]) {
        groups[nftId] = [];
      }
      groups[nftId].push(item);
      return groups;
    }, {});

    var compounds = {};
    for (const key in groupedResults) {
      if (Object.hasOwnProperty.call(groupedResults, key)) {
        const group = groupedResults[key];
        var burn_nft_items = [];
        group.forEach(item => {
          burn_nft_items.push(item.burn_nft_item);
        });

        compounds = {
          nft_item: group[0].nft_item,
          burn_nft_items
        };
      }
    }

    return {
      success: true,
      data: {
        records: compounds
      }
    };
  } catch (error) {
    logger.error(`[getCompoundByGameId];${error}`, error);
    return {
      success: false,
      message: "An error occurred"
    };
  }
};