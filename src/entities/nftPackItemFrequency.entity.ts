import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftPack } from "./nftPack.entity";
import { nftItem } from "./nftItem.entity";

@Entity("nft_pack_item_frequencies")
export class nftPackItemFrequency extends DefaultEntity {
    @ManyToOne(() => nftPack, (nftPack) => nftPack.id)
    @JoinColumn({
        name: "nft_pack_id",
    })
    nft_pack: nftPack;

    @ManyToOne(() => nftItem, (nftItem) => nftItem.id)
    @JoinColumn({
        name: "nft_item_id",
    })
    nft_item: nftItem;

    @Column({
        nullable: false,
    })
    frequency: number

    @Column({
        nullable: false
    })
    activation: boolean
}