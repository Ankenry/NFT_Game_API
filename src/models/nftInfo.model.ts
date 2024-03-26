export interface INftInfoModel {
  user_id: number,
  contract_address: string,
  txhash: string,
  token_id: number,
  token_metadata: string,
  thumbnail: string,
  network: string,
  from: string,
  metadata_attr: string,
  to: string,
  is_burn: boolean
}