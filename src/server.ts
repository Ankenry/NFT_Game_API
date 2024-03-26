import app from "./app";
import * as nftService from "./services/nftService";
import * as nft1155Service from "./services/nft1155Service";
import * as erc20Service from "./services/erc20Service";
import * as cryptoAccountService from "./services/cryptoAccountService";
import * as loginService from "./services/loginService";
import * as ipfsService from "./services/ipfsService";
import * as helperService from "./services/helperService";
import * as envConfig from "./env-config.json";
import * as smartContractService from "./services/smartContractService";
import * as nftGameService from "./services/nftGameService";

import logger from "./logger/winston";
import swaggerUi from "swagger-ui-express";
import { checkJwt } from "./middlewares/checkJwt";
import { swaggerSpec } from "./swagger";

import { INftMintReqModel, INftMintResModel } from "./models/nft.model"

const dotenv = require("dotenv");
const multer = require("multer");

const upload = multer();

dotenv.config({
  path: process.env.NODE_ENV === "development" ? ".env" : ".env",
});

const PORT = envConfig.port;
app.listen(PORT, async () => {
  logger.info(`[Start Application] Server is running on port: ${PORT}`);
});
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log(`Docs available at http://localhost:${PORT}/swagger`);
app.get("/api/health-check", async (req, res) => {
  res.status(200).json("Ok");
});

/**
 * @openapi
 * components:
 *  schemas:
 *    Login:
 *      type: object
 *      required:
 *        - username
 *        - password
 *      properties:
 *        username:
 *          type: string
 *        password:
 *          type: string
 */
/**
 * @openapi
 * '/api/login':
 *  post:
 *     tags:
 *     - api
 *     summary: Used for login. Returns JWT (JSON Web Token) upon successful authentication.
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/Login'
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool 
 *                    default: true
 *                  token: 
 *                    type: string
 *                  exprired_in:
 *                    type: number
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool 
 *                    default: false
 *                  message: 
 *                    type: string
 *                    default: Wrong username or password
 */
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    const data = await loginService.login(req.body);
    if (data?.success) {
      res.status(200).json(data);

      return;
    } else {
      res.status(400).json(data);

      return;
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Bad request",
    });

    return;
  }
});

/**
 * @openapi
 * '/api/create-wallet':
 *  post:
 *     tags:
 *     - api
 *     summary: Create wallet with private key and public
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  address:
 *                    type: string
 *                  privateKey:
 *                    type: string
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.post("/api/create-wallet", [checkJwt], async (req, res) => {
  const networkId = helperService.getNetworkIdFromReqHeader(req);
  var result = await cryptoAccountService.createWallet(networkId);
  res.status(200).json(result);
});

/**
 * @openapi
 * '/api/validate-address':
 *  get:
 *     tags:
 *     - api
 *     summary: Check if the wallet address format is valid
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter address.
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                    default: Address is valid
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/validate-address", [checkJwt], async (req, res) => {
  var address = req.query.address;
  const networkId = helperService.getNetworkIdFromReqHeader(req);
  var validateWalletAddressRes = await cryptoAccountService.validateWalletAddress(networkId, address);
  res.status(200).json(validateWalletAddressRes);
});

/**
 * @openapi
 * '/api/balance':
 *  get:
 *     tags:
 *     - api
 *     summary: Retrieves native token of blockchain network
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter address.
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  symbol:
 *                    type: string
 *                  balance:
 *                    type: string
 *                  balanceInWei:
 *                    type: string
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.get("/api/balance", [checkJwt], async (req, res) => {
  var address = req.query.address;
  var networkId = helperService.getNetworkIdFromReqHeader(req);

  if (address) {
    const isAddressValidResult = await cryptoAccountService.validateWalletAddress(networkId, address);
    if (isAddressValidResult?.success) {
      var result = await cryptoAccountService.getAddressBalance(networkId, address);
      res.status(200).json(result);

      return;
    } else {
      res.status(400).json(isAddressValidResult);

      return;
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Bad request",
    });

    return;
  }
});

/**
 * @openapi
 * components:
 *  schemas:
 *    Deploy_nft_contract:
 *      type: object
 *      required:
 *        - fromPrivate
 *        - tokenName
 *        - tokenSymbol`
 *      properties:
 *        fromPrivate:
 *          type: string
 *        tokenName:
 *          type: string
 *        tokenSymbol:
 *          type: string
 */
/**
 * @openapi
 * '/api/deploy-nft-contract':
 *  post:
 *     tags:
 *     - api
 *     summary: Deploy and Verify NFT on-chain and make it mintable
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/Deploy_nft_contract'
 *     responses:
 *      200:
 *        description: Deploy NFT smart contract success.
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                  smartContractAddress:
 *                    type: string
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again.
 */
app.post("/api/deploy-nft-contract", [checkJwt], async (req, res) => {
  var fromPrivate = req.body.fromPrivate;
  var tokenName = req.body.tokenName;
  var tokenSymbol = req.body.tokenSymbol;

  var result = await smartContractService.deploySmartContract(
    fromPrivate,
    tokenName,
    tokenSymbol
  );
  res.status(200).json(result);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    MintNFT:
 *      type: object
 *      required:
 *        - fromPrivate
 *        - player
 *        - tokenMetaData
 *        - thumbnail
 *        - clientUserId
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        receiveAddress:
 *          type: string
 *        tokenMetaData:
 *          type: string
 *        thumbnail:
 *          type: string
 *        clientUserId:
 *          type: number
 */
/**
 * @openapi
 * '/api/mint-nft':
 *  post:
 *     tags:
 *     - api
 *     summary: Mint the deployed NFT.
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/MintNFT'
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.post("/api/mint-nft", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var receiveAddress = req.body.receiveAddress;
  var tokenMetaData = req.body.tokenMetaData;
  var thumbnail = req.body.thumbnail;
  var clientUserId = req.body.clientUserId;

  if (tokenMetaData == undefined) {
    tokenMetaData = "";
  }

  if (owerPrivateKey == undefined || owerPrivateKey == null) {
    res.status(400).json({
      success: false,
      message: "fromPrivate is required!",
    });

    return;
  }

  if (receiveAddress == undefined || receiveAddress == null) {
    res.status(400).json({
      success: false,
      message: "receiver is required!",
    });

    return;
  }

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  const isAddressValidResult = await cryptoAccountService.validateWalletAddress(networkId, receiveAddress);
  if (!isAddressValidResult) {
    res.status(400).json(isAddressValidResult);
  }

  var transactions = await nftService.mintNft(networkId,
    owerPrivateKey,
    receiveAddress,
    tokenMetaData,
    thumbnail,
    clientUserId
  );

  res.status(200).json(transactions);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    MintNFTWithFile:
 *      type: object
 *      required:
 *        - owerPrivateKey
 *        - receiveAddress
 *        - thumbnail
 *        - clientUserId
 *        - name
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        receiveAddress:
 *          type: string
 *        thumbnail:
 *          type: file
 *        clientUserId:
 *          type: string
 *        name:
 *          type: string
 *        description:
 *          type: string
 *        external_url:
 *          type: string
 *        attributes:
 *          type: string
 *          default: "[ { \"trait_type\": \"Base\", \"value\": \"Starfish\" }, { \"display_type\": \"number\", \"trait_type\": \"Generation\", \"value\": 2 } ]"
 *          description: "\"Attributes\" is an array of multiple dictionaries that can include \"display_type,\" \"trait_type,\" and \"value,\" and it is converted to a string format."
 */
/**
 * @openapi
 * '/api/mint-nft-with-file':
 *  post:
 *     tags:
 *     - api
 *     consumes:
 *      - multipart/form-data
 *     produces:
 *      - application/json
 *     requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *           schema:
 *              $ref: '#/components/schemas/MintNFTWithFile'
 *     summary: Mint the deployed NFT.
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.post("/api/mint-nft-with-file", upload.single("thumbnail"), [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var receiveAddress = req.body.receiveAddress;
  const thumbnail = req.file;
  var clientUserId = req.body.clientUserId;
  var name = req.body.name;
  var description = req.body.description;
  var external_url = req.body.external_url;
  var attributes = req.body.attributes;

  if (owerPrivateKey == undefined || owerPrivateKey == null) {
    res.status(400).json({
      success: false,
      message: "fromPrivate is required!",
    });

    return;
  }

  if (receiveAddress == undefined || receiveAddress == null) {
    res.status(400).json({
      success: false,
      message: "receiver is required!",
    });

    return;
  }

  var mintNftReq: INftMintReqModel = {
    owerPrivateKey: owerPrivateKey,
    attributes: attributes,
    clientUserId: clientUserId,
    description: description,
    external_url: external_url,
    name: name,
    receiveAddress: receiveAddress,
    thumbnail: thumbnail
  };

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  var transactions = await nftService.mintNftWithImage(networkId, mintNftReq);
  res.status(200).json(transactions);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    Update_token_metadata:
 *      type: object
 *      required:
 *        - owerPrivateKey
 *        - tokenId
 *        - tokenMetaData
 *        - nftInfoId
 *        - thumbnail
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        tokenId:
 *          type: string
 *        tokenMetaData:
 *          type: string
 *        nftInfoId:
 *          type: number
 *        thumbnail:
 *          type: string
 */
/**
 * @openapi
 * '/api/update-token-metadata':
 *  post:
 *     tags:
 *     - api
 *     summary: Update token metadata
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/Update_token_metadata'
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.post("/api/update-token-metadata", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var nftInfoId = req.body.nftInfoId;
  var tokenMetaData = req.body.tokenMetaData;
  var thumbnail = req.body.thumbnail;

  if (tokenMetaData == undefined) {
    tokenMetaData = "";
  }

  if (owerPrivateKey == undefined || owerPrivateKey == null) {
    res.status(400).json({
      success: false,
      message: "owerPrivateKey is required!",
    });

    return;
  }

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  var transactions = await nftService.updateTokenMetaData(networkId,
    owerPrivateKey,
    nftInfoId,
    tokenMetaData,
    thumbnail
  );

  res.status(200).json(transactions);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    Transfer:
 *      type: object
 *      required:
 *        - owerPrivateKey
 *        - receiveAddress
 *        - tokenId
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        receiveAddress:
 *          type: string
 *        tokenId:
 *          type: number
 */
/**
 * @openapi
 * '/api/transfer':
 *  post:
 *     tags:
 *     - api
 *     summary: Transfer the NFT
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/Transfer'
 *     responses:
 *      200:
 *        description: Transfer success.
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again.
 */
app.post("/api/transfer", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var receiveAddress = req.body.receiveAddress;
  var tokenId = req.body.tokenId;

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  var result = await nftService.transferNft(networkId,
    owerPrivateKey,
    receiveAddress,
    tokenId
  );
  res.status(200).json(result);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    Burn_nft:
 *      type: object
 *      required:
 *        - fromPrivate
 *        - tokenId
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        tokenId:
 *          type: number
 */
/**
 * @openapi
 * '/api/burn':
 *  post:
 *     tags:
 *     - api
 *     summary: Burn NFT
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/Burn_nft'
 *     responses:
 *      200:
 *        description: Burn nft success.
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again.
 */
app.post("/api/burn", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var tokenId = req.body.tokenId;

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  var result = await nftService.burnNft(networkId, owerPrivateKey, tokenId);
  res.status(200).json(result);
});

/**
 * @openapi
 * '/api/nft-by-owner-address':
 *  get:
 *     tags:
 *     - api
 *     summary: Get the list of NFTs held by the specified EOA. The NFT list will be get from database by owner address
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *       - in: query
 *         name: ownerAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter owner address.
 *       - in: query
 *         name: pageIndex
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter page index.
 *       - in: query
 *         name: pageSize
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter page size.
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                success:
 *                  type: boolean
 *                  default: true
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/nft-by-owner-address", [checkJwt], async (req, res) => {
  var ownerAddress = req.query.ownerAddress;
  var pageIndex = req.query.pageIndex;
  var pageSize = req.query.pageSize;

  var transRes = await nftService.getManyNftByOwnerAddress(
    ownerAddress,
    pageIndex,
    pageSize
  );
  res.status(200).json(transRes);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    Upload_to_ipfs:
 *      type: object
 *      required:
 *        - thumbnail
 *        - attributes
 *      properties:
 *        thumbnail:
 *          type: file
 *        attributes:
 *          type: string
 *          default: "[ { \"trait_type\": \"Base\", \"value\": \"Starfish\" }, { \"display_type\": \"number\", \"trait_type\": \"Generation\", \"value\": 2 } ]"
 *          description: "\"Attributes\" is an array of multiple dictionaries that can include \"display_type,\" \"trait_type,\" and \"value,\" and it is converted to a string format."
 *        description:
 *          type: string
 *        external_url:
 *          type: string
 *        name:
 *          type: string
 */
/**
 * @openapi
 * '/api/upload-to-ipfs':
 *  post:
 *     tags:
 *     - api
 *     consumes:
 *      - multipart/form-data
 *     produces:
 *      - application/json
 *     requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *           schema:
 *              $ref: '#/components/schemas/Upload_to_ipfs'
 *     summary: Uploading files to IPFS
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  cid:
 *                    type: string
 *                  ipfsUrl:
 *                    type: string
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 *                    default: File not found
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.post(
  "/api/upload-to-ipfs",
  [checkJwt],
  upload.single("thumbnail"),
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "File not found",
      });

      return;
    }

    const thumbnail = req.file;
    var name = req.body.name;
    var description = req.body.description;
    var external_url = req.body.external_url;
    var attributes = req.body.attributes;

    let parsedAttributes;
    try {
      parsedAttributes = JSON.parse(attributes);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Invalid JSON format in attributes",
      });
      return;
    }

    var result = await ipfsService.uploadToIpfs(
      name,
      description,
      thumbnail,
      parsedAttributes,
      external_url
    );

    res.status(200).json(result);
  }
);

/**
 * @openapi
 * components:
 *  schemas:
 *    Upload_multiple_file_to_ipfs:
 *      type: object
 *      required:
 *        - thumbnail
 *      properties:
 *        thumbnail:
 *          type: array
 *          items:
 *            type: string
 *            format: binary
 */
/**
 * @openapi
 * '/api/upload-multiple-files-to-ipfs':
 *  post:
 *     tags:
 *     - api
 *     consumes:
 *      - multipart/form-data
 *     produces:
 *      - application/json
 *     requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *           schema:
 *              $ref: '#/components/schemas/Upload_multiple_file_to_ipfs'
 *     summary: Uploading files to IPFS
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  cid:
 *                    type: string
 *                  ipfsUrl:
 *                    type: string
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 *                    default: File not found
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.post(
  "/api/upload-multiple-files-to-ipfs",
  [checkJwt],
  upload.array("thumbnail"),
  async (req, res) => {
    if (!req.files) {
      res.status(400).json({
        success: false,
        message: "File not found",
      });

      return;
    }

    var uploadImgs = [];
    for (let i = 0; i < req.files.length; i++) {
      const element = req.files[i];
      uploadImgs.push(element);
    }

    var result = await ipfsService.uploadBatch(
      uploadImgs,
    );

    res.status(200).json(result);
  }
);

/**
 * @openapi
 * '/api/estimate-gas-for-mint':
 *  get:
 *     tags:
 *     - api
 *     summary: Check address have enough estimate gas
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *       - in: query
 *         name: ownerAddress
 *         type: string
 *         require: true
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  isEnoughBalance:
 *                    type: bool
 *                  message:
 *                    type: string
 *                  gasLimit:
 *                    type: number
 *                  gasPrice:
 *                    type: number
 *                  gasInEth:
 *                    type: number
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 *                    default: Address is invalid
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.get("/api/estimate-gas-for-mint", [checkJwt], async (req, res) => {
  var ownerAddress = req.query.ownerAddress;
  if (!ownerAddress) {
    res.status(400).json({
      success: false,
      message: "Bad request",
    });

    return;
  }

  const networkId = helperService.getNetworkIdFromReqHeader(req);
  const isAddressValidResult = await cryptoAccountService.validateWalletAddress(networkId, ownerAddress);

  if (isAddressValidResult?.success) {
    var result = await nftService.checkEstimateGasForMint(networkId, ownerAddress);
    res.status(200).json(result);

    return;
  } else {
    res.status(400).json(isAddressValidResult);

    return;
  }
});

/**
 * @openapi
 * '/api/nft-info':
 *  get:
 *     tags:
 *     - api
 *     summary: Get 1 NFT information
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *       - in: query
 *         name: txHash
 *         type: string
 *         require: true
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                success:
 *                  type: boolean
 *                  default: true
 *                data:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      default: ""
 *                    txhash:
 *                      type: string
 *                      default: ""
 *                    from:
 *                      type: string
 *                      default: ""
 *                    to:
 *                      type: string
 *                      default: ""
 *                    trans_type:
 *                      type: string
 *                      default: ""
 *                    token_id:
 *                      type: number
 *                      default: 0
 *                    owner_address:
 *                      type: string
 *                      default: ""
 *                    token_metadata:
 *                      type: string
 *                      default: ""
 *                    thumbnail:
 *                      type: string
 *                      default: ""
 *                    network:
 *                      type: string
 *                      default: ""
 *                    metadata_attr:
 *                      type: string
 *                      default: ""
 *                    is_burn:
 *                      type: boolean
 *                      default: true
 *                    mintDate:
 *                      type: string
 *                      format: date-time
 *                      default: "2023-09-09T01:00:00Z"
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 *                    default: Bad request
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/nft-info", [checkJwt], async (req, res) => {
  var txHash = req.query.txHash;
  if (txHash) {
    var transRes = await nftService.getNFTInfoInDatabase(txHash);
    res.status(200).json(transRes);

    return;
  } else {
    res.status(400).json({
      success: false,
      message: "Bad request",
    });

    return;
  }
});

/**
 * @openapi
 * components:
 *  schemas:
 *    NativeCoinTransfer:
 *      type: object
 *      required:
 *        - owerPrivateKey
 *        - receiveAddress
 *        - amount
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        receiveAddress:
 *          type: string
 *        amount:
 *          type: number
 */
/**
 * @openapi
 * 'api/native-coin-transfer':
 *  post:
 *     tags:
 *     - api
 *     summary: Native coin transfer
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/NativeCoinTransfer'
 *     responses:
 *      200:
 *        description: Transfer success.
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again.
 */
app.post("/api/native-coin-transfer", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var receiveAddress = req.body.receiveAddress;
  var amount = req.body.amount;

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  var result = await erc20Service.sendTransaction(networkId,
    owerPrivateKey,
    receiveAddress,
    amount
  );
  res.status(200).json(result);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    ERC1155MintNFT:
 *      type: object
 *      required:
 *        - fromPrivate
 *        - receiveAddress
 *        - id
 *        - amount
 *        - clientUserId
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        receiveAddress:
 *          type: string
 *        id:
 *          type: string
 *        amount:
 *          type: number
 *        clientUserId:
 *          type: number
 */
/**
 * @openapi
 * '/api/erc1155/mint-nft':
 *  post:
 *     tags:
 *     - api
 *     summary: Mint the deployed NFT.
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/ERC1155MintNFT'
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.post("/api/erc1155/mint-nft", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var receiveAddress = req.body.receiveAddress;
  var id = req.body.id;
  var amount = req.body.amount;
  var clientUserId = req.body.clientUserId;

  if (owerPrivateKey == undefined || owerPrivateKey == null) {
    res.status(400).json({
      success: false,
      message: "fromPrivate is required!",
    });

    return;
  }

  if (receiveAddress == undefined || receiveAddress == null) {
    res.status(400).json({
      success: false,
      message: "receiver is required!",
    });

    return;
  }

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  const isAddressValidResult = await cryptoAccountService.validateWalletAddress(networkId, receiveAddress);
  if (!isAddressValidResult) {
    res.status(400).json(isAddressValidResult);
  }

  var transactions = await nft1155Service.mintNft(networkId,
    owerPrivateKey,
    receiveAddress,
    id,
    amount,
    clientUserId
  );

  res.status(200).json(transactions);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    ERC1155SetBaseUri:
 *      type: object
 *      required:
 *        - fromPrivate
 *        - baseUri
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        baseUri:
 *          type: string
 */
/**
 * @openapi
 * '/api/erc1155/set-base-uri':
 *  post:
 *     tags:
 *     - api
 *     summary: Set baseUri the deployed NFT.
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/ERC1155SetBaseUri'
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.post("/api/erc1155/set-base-uri", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var baseUri = req.body.baseUri;

  if (owerPrivateKey == undefined || owerPrivateKey == null) {
    res.status(400).json({
      success: false,
      message: "fromPrivate is required!",
    });

    return;
  }

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  var transactions = await nft1155Service.setBaseUri(networkId,
    owerPrivateKey,
    baseUri
  );

  res.status(200).json(transactions);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    ERC1155BurnNFT:
 *      type: object
 *      required:
 *        - fromPrivate
 *        - receiveAddress
 *        - id
 *        - amount
 *        - clientUserId
 *      properties:
 *        owerPrivateKey:
 *          type: string
 *        receiveAddress:
 *          type: string
 *        id:
 *          type: string
 *        amount:
 *          type: number
 *        clientUserId:
 *          type: number
 */
/**
 * @openapi
 * '/api/erc1155/burn-nft':
 *  post:
 *     tags:
 *     - api
 *     summary: Burn the deployed NFT.
 *     parameters:
 *       - in: header
 *         name: network_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enter the networkId (polygon or oasy).
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/ERC1155BurnNFT'
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  txHash:
 *                    type: string
 *                  tokenId:
 *                    type: number
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 *        content:
 *
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 */
app.post("/api/erc1155/burn-nft", [checkJwt], async (req, res) => {
  var owerPrivateKey = req.body.owerPrivateKey;
  var receiveAddress = req.body.receiveAddress;
  var id = req.body.id;
  var amount = req.body.amount;
  var clientUserId = req.body.clientUserId;

  if (owerPrivateKey == undefined || owerPrivateKey == null) {
    res.status(400).json({
      success: false,
      message: "fromPrivate is required!",
    });

    return;
  }

  if (receiveAddress == undefined || receiveAddress == null) {
    res.status(400).json({
      success: false,
      message: "receiver is required!",
    });

    return;
  }

  var networkId = helperService.getNetworkIdFromReqHeader(req);
  const isAddressValidResult = await cryptoAccountService.validateWalletAddress(networkId, receiveAddress);
  if (!isAddressValidResult) {
    res.status(400).json(isAddressValidResult);
  }

  var transactions = await nft1155Service.burnNft(networkId,
    owerPrivateKey,
    receiveAddress,
    id,
    amount,
    clientUserId
  );

  res.status(200).json(transactions);
});

/**
 * @openapi
 * '/api/game-nft-collection/verify-gesoten-login-token':
 *  get:
 *     tags:
 *     - api
 *     summary: Verify login token
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                    default: Address is valid
 */
app.post("/api/game-nft-collection/verify-gesoten-login-token", async (req, res) => {
  const { token } = req.query;
  if (token == null || token == undefined) {
    return {
      success: false,
      message: "Token invalid"
    };
  }

  const data = await loginService.verifyLoginToken(token.toString());
  if (data?.success) {
    res.status(200).json(data);

    return;
  } else {
    res.status(400).json(data);

    return;
  }
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-games':
 *  get:
 *     tags:
 *     - api
 *     summary: Get list of NFT game
 *     parameters:
 *       - in: query
 *         name: page_index
 *         required: false
 *         schema:
 *           type: number
 *         description: page_index
 *       - in: query
 *         name: page_size
 *         required: false
 *         schema:
 *           type: number
 *         description: page_size
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                    default: 
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/game-nft-collection/nft-games", [checkJwt], async (req, res) => {
  var page_index = req.query.page_index;
  var page_size = req.query.page_size;
  const games = await nftGameService.getNftGame(page_index, page_size);

  res.status(200).json(games);
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-game-by-id':
 *  get:
 *     tags:
 *     - api
 *     summary: Get NFT game by Id
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                    default: 
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */


app.get("/api/game-nft-collection/nft-game-by-id", [checkJwt], async (req, res) => {
  var game_id = req.query.id;
  const games = await nftGameService.getNftGameById(game_id);

  res.status(200).json(games);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    OpenNftPack:
 *      type: object
 *      required:
 *        - game_id
 *        - user_id
 *        - nft_pack_id
 *      properties:
 *        game_id:
 *          type: string
 *        user_id:
 *          type: number
 *        nft_pack_id:
 *          type: string
 */
/**
 * @openapi
 * '/api/game-nft-collection/open-nft-pack':
 *  post:
 *     tags:
 *     - api
 *     summary: Open a NFT pack
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/OpenNftPack'
 *     responses:
 *      200:
 *        description: Return a NFT item
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool 
 *                    default: true
 *      400 :
 *        description: Incorrect
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool 
 *                    default: false
 *                  message: 
 *                    type: string
 *                    default: Bad request
 */
app.post("/api/game-nft-collection/open-nft-pack", [checkJwt], async (req, res) => {
  var game_id = req.body.game_id;
  var user_id = req.body.user_id;
  var nft_pack_id = req.body.nft_pack_id;

  const nftInfo = await nftGameService.openNftPack(game_id, user_id, nft_pack_id);

  res.status(200).json(nftInfo);
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-packs':
 *  get:
 *     tags:
 *     - api
 *     summary: Get list of NFT pack
 *     parameters:
 *       - in: query
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: game_id
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: number
 *         description: user_id
 *       - in: query
 *         name: page_index
 *         required: false
 *         schema:
 *           type: number
 *         description: page_index
 *       - in: query
 *         name: page_size
 *         required: false
 *         schema:
 *           type: number
 *         description: page_size
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                    default: 
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/game-nft-collection/nft-packs", [checkJwt], async (req, res) => {
  var game_id = req.query.game_id;
  var user_id = req.query.user_id;
  var page_index = req.query.page_index;
  var page_size = req.query.page_size;
  const packByUsers = await nftGameService.getPackByUserId(game_id, user_id, page_index, page_size);

  res.status(200).json(packByUsers);
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-by-user':
 *  get:
 *     tags:
 *     - api
 *     summary: Get list of NFT by user_id
 *     parameters:
 *       - in: query
 *         name: game_id
 *         required: true
 *         schema:
 *           type: string
 *         description: game_id
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: number
 *         description: user_id
 *       - in: query
 *         name: page_index
 *         required: false
 *         schema:
 *           type: number
 *         description: page_index
 *       - in: query
 *         name: page_size
 *         required: false
 *         schema:
 *           type: number
 *         description: page_size
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                    default: 
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/game-nft-collection/nft-by-user", [checkJwt], async (req, res) => {
  var game_id = req.query.game_id;
  var user_id = req.query.user_id;
  var page_index = req.query.page_index;
  var page_size = req.query.page_size;
  const userNfts = await nftGameService.getNftByUserId(game_id, user_id, page_index, page_size);

  res.status(200).json(userNfts);
});

/**
 * @openapi
 * components:
 *  schemas:
 *    AssignNftPackToUser:
 *      type: object
 *      required:
 *        - game_id
 *        - user_id
 *      properties:
 *        game_id:
 *          type: string
 *        user_id:
 *          type: number
 */
/**
 * @openapi
 * '/api/game-nft-collection/assign-nft-pack-to-user':
 *  post:
 *     tags:
 *     - api
 *     summary: Assign NFT Pack to user
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *              $ref: '#/components/schemas/AssignNftPackToUser'
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool 
 *                    default: true
 *                  message: 
 *                    type: string
 *      400 :
 *        description: Bad request
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool 
 *                    default: false
 *                  message: 
 *                    type: string
 *                    default: 
 */
app.post("/api/game-nft-collection/assign-nft-pack-to-user", async (req, res) => {
  const { game_id, user_id } = req.body;
  if (game_id && game_id) {
    const data = await nftGameService.assignNftPackToUser(game_id, user_id);
    if (data?.success) {
      res.status(200).json(data);

      return;
    } else {
      res.status(400).json(data);

      return;
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Bad request",
    });

    return;
  }
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-item-by-pack':
 *  get:
 *     tags:
 *     - api
 *     summary: Get list of NFT item by pack_id
 *     parameters:
 *       - in: query
 *         name: pack_id
 *         required: true
 *         schema:
 *           type: number
 *         description: pack_id
 *       
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: true
 *                  message:
 *                    type: string
 *                    default: 
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/game-nft-collection/nft-item-by-pack", [checkJwt], async (req, res) => {
  var pack_id = req.query.pack_id;
  const pack_item = await nftGameService.getNftByPackId(pack_id);

  res.status(200).json(pack_item);
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-item-by-id':
 *  get:
 *     tags:
 *     - api
 *     summary: Get 1 NFT information
*     parameters:
 *       - in: query
 *         name: nft_id
 *         required: true
 *         schema:
 *           type: number
 *         description: nft_id
 * 
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                success:
 *                  type: boolean
 *                  default: true
 *                data:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      default: ""
 *                    name:
 *                      type: string
 *                      default: ""
 *                    rarity:
 *                      type: number
 *                      default: ""
 *                    thumbnail:
 *                      type: string
 *                      default: ""
 *                    metadata_url:
 *                      type: string
 *                      default: ""
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 *                    default: Bad request
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/game-nft-collection/nft-item-by-id", [checkJwt], async (req, res) => {
  var nft_id = req.query.nft_id;
  const nft_item = await nftGameService.getNftItemById(Number(nft_id));

  res.status(200).json(nft_item);
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-item-by-id':
 *  get:
 *     tags:
 *     - api
 *     summary: Get 1 NFT information
*     parameters:
 *       - in: query
 *         name: nft_id
 *         required: true
 *         schema:
 *           type: number
 *         description: nft_id
 * 
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                success:
 *                  type: boolean
 *                  default: true
 *                data:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      default: ""
 *                    name:
 *                      type: string
 *                      default: ""
 *                    rarity:
 *                      type: number
 *                      default: ""
 *                    thumbnail:
 *                      type: string
 *                      default: ""
 *                    metadata_url:
 *                      type: string
 *                      default: ""
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 *                    default: Bad request
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/game-nft-collection/nft-item-by-id", [checkJwt], async (req, res) => {
  var nft_id = req.query.nft_id;
  const nft_item = await nftGameService.getNftItemById(Number(nft_id));

  res.status(200).json(nft_item);
});

/**
 * @openapi
 * '/api/game-nft-collection/nft-compound':
 *  get:
 *     tags:
 *     - api
 *     summary: Get NFT Compund by Game ID
*     parameters:
 *       - in: query
 *         name: game_id
 *         required: true
 *         schema:
 *           type: number
 *         description: game_id
 * 
 *     responses:
 *      200:
 *        description: Successful, includes the JSON format from the body of the response (each API may differ)
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                success:
 *                  type: boolean
 *                  default: true
 *                data:
 *                  type: object
 *                  properties:
 *                    id:
 *                      type: string
 *                      default: ""
 *                    name:
 *                      type: string
 *                      default: ""
 *                    rarity:
 *                      type: number
 *                      default: ""
 *                    thumbnail:
 *                      type: string
 *                      default: ""
 *                    metadata_url:
 *                      type: string
 *                      default: ""
 *      400 :
 *        description: The parameters used for the API are incorrect (in JSON format).
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  success:
 *                    type: bool
 *                    default: false
 *                  message:
 *                    type: string
 *                    default: Bad request
 *      401 :
 *        description: Authentication error from Authorization header. Please re-login and generate token again
 */
app.get("/api/game-nft-collection/nft-compound", [checkJwt], async (req, res) => {
  var game_id = req.query.game_id;
  const nft_item = await nftGameService.getCompoundByGameId(game_id);

  res.status(200).json(nft_item);
});