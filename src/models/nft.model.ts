export interface INftMintReqModel {
  owerPrivateKey: string,
  receiveAddress: string,
  clientUserId: number,
  name: string,
  description: string,
  thumbnail: any, // Image file to mint NFT
  attributes: any,
  external_url: string
}

export interface INftMintResModel {
  txHash: string,
  tokenId: number,
  tokenMetadata: string,
  thumbnail: string,
}