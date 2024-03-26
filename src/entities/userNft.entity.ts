import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftItem } from "./nftItem.entity";
import { UUID } from "crypto";

@Entity("user_nfts")
export class userNft extends DefaultEntity {
    @ManyToOne(() => nftItem, (nftItem) => nftItem.id)
    @JoinColumn({
        name: "nft_id",
    })
    nft_item: nftItem;

    @Column({
        nullable: false,
    })
    user_id: number

    @Column({
        nullable: false
    })
    activation: boolean

    @Column({
        length: 50,
        nullable: false
    })
    status: string  // VALID/BURN/TRANSFERED
}