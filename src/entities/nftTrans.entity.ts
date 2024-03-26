import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftInfo } from "./nftInfo.entity";

@Entity()
export class nftTrans extends DefaultEntity {
    @ManyToOne(() => nftInfo, (nftInfo) => nftInfo.id)
    @JoinColumn({
        name: "nft_info_id",
      })
    nft_info: nftInfo | string | undefined;

    @Column({
        nullable: true,
        length: 255
    })
    txhash: string

    @Column({
        nullable: true,
        length: 255
    })
    from: string

    @Column({
        nullable: true,
        length: 255
    })
    to: string

    @Column({
        length: 50
    })
    trans_type: string
}