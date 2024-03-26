import logger from "../logger/winston";
import { BaseResponse, GenericBaseResponse } from "../models/base.response"
import { INftMintReqModel } from "../models/ipfs.model"

const { ThirdwebStorage } = require("@thirdweb-dev/storage");
const storage = new ThirdwebStorage({
  secretKey: process.env.THIRDWEB_SECRET_KEY,
  gatewayUrls: ["https://ipfs.io/ipfs/"]
});

export const uploadToIpfs = async (name: string,
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
    var jsonContent =
    {
      name: name,
      description: description,
      external_url: external_url,
      image: thumbnail,
      attributes: attributes
    };

    const uploadJson = await storage.upload(jsonContent);

    console.log(`uploadJson`, uploadJson);

    // And easily retrieve the metadata
    const metadata = await storage.downloadJSON(uploadJson);
    console.log(`metadata`, metadata);

    return {
      success: true,
      data: {
        cid: null,
        ipfsMetadataUrl: storage.resolveScheme(uploadJson),
        ipfsThumbnailUrl: null
      },
      message_code: -1,
      message: "Upload to IPFS successfully"
    };
  } catch (error) {
    logger.error(`[uploadToIpfs] ${error}`, error);
    return {
      success: false,
      message: "An error occurs",
      data: null,
      message_code: -1
    }
  }
};

export const uploadBatch = async (imageFileArrs: any): Promise<GenericBaseResponse<INftMintReqModel>> => {
  try {
    if (imageFileArrs == null) {
      return {
        success: false,
        message: "imageFileArrs is required",
        data: null,
        message_code: -1
      };
    }

    var metadataJson = [];

    for (let i = 0; i < imageFileArrs.length; i++) {
      const imageFile = imageFileArrs[i];
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

      metadataJson.push(imageFile.buffer);
    }

    if (metadataJson == undefined || metadataJson == null || metadataJson.length == 0) {
      return {
        success: false,
        message: "No image files found to upload",
        data: null,
        message_code: -1
      };
    }

    var directoryPath = "";
    const uploadJson = await storage.uploadBatch(metadataJson);
    if (uploadJson != undefined && uploadJson.length > 0) {
      directoryPath = storage.resolveScheme(uploadJson[0]).replace('/0', '');
    }

    return {
      success: true,
      data: {
        cid: null,
        ipfsMetadataUrl: directoryPath,
        ipfsThumbnailUrl: null
      },
      message_code: -1,
      message: "Upload to IPFS successfully"
    };
  } catch (error) {
    logger.error(`[uploadToIpfs] ${error}`, error);
    return {
      success: false,
      message: "An error occurs",
      data: null,
      message_code: -1
    }
  }
};