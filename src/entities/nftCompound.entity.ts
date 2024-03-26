import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftItem } from "./nftItem.entity";

@Entity("nft_compounds")
export class nftCompound extends DefaultEntity {
    @ManyToOne(() => nftItem, (nftItem) => nftItem.id)
    @JoinColumn({
        name: "nft_item_id",
    })
    nft_item: nftItem;

    @ManyToOne(() => nftItem, (nftItem) => nftItem.id)
    @JoinColumn({
        name: "burn_nft_item_id",
    })
    burn_nft_item: nftItem;

    @Column({
        nullable: false
    })
    activation: boolean
}