import Arweave from "arweave";
import logger from "../logger/winston";
import { BaseResponse, GenericBaseResponse } from "../models/base.response"
import { INftMintReqModel } from "../models/ipfs.model"

import * as jwk from "../../new-arweave-key.json";

export const uploadToARWeave = async (name: string,
  description: string,
  imageFile: any,
  attributes: any,
  external_url: string): Promise<GenericBaseResponse<INftMintReqModel>> => {
  try {
    if (!imageFile.mimetype.match(/^image/)) {
      console.log('Mime type invalid ', imageFile.mimetype);

      return {
        success: false,
        message: "Invalid thumbnail file (only support image files)",
        data: null,
        message_code: -1
      };
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message: `File too large ${imageFile.size}`,
        data: null,
        message_code: -1
      };
    }

    var thumbnail = imageFile.buffer;
    const arweave = Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https",
      timeout: 20000, // Network request timeouts in milliseconds
      logging: false, // Disable network request logging
    });

    // Create and submit transaction
    let key = await arweave.wallets.generate();
    const transaction = await arweave.createTransaction(
      {
        data: thumbnail,
      },
      jwk
    );
    transaction.addTag('Content-Type', 'image/png');

    await arweave.transactions.sign(transaction, jwk);
    const response = await arweave.transactions.post(transaction);
    console.log(response.status);

    return {
      success: true,
      data: {
        cid: null,
        ipfsMetadataUrl: null,
        ipfsThumbnailUrl: null
      },
      message_code: -1,
      message: "Upload to ARWeave successfully"
    };
  } catch (error) {
    logger.error(`[uploadToARWeave] ${error}`, error);
    return {
      success: false,
      message: "An error occurs",
      data: null,
      message_code: -1
    }
  }
};