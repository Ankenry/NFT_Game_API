import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftPack } from "./nftPack.entity";

@Entity("nft_pack_rarity_rates")
export class nftPackRarityRate extends DefaultEntity {
    @ManyToOne(() => nftPack, (nftPack) => nftPack.id)
    @JoinColumn({
        name: "nft_pack_id",
    })
    nft_pack: nftPack;

    @Column({
        nullable: false,
    })
    rarity: number

    @Column({
        nullable: false,
    })
    rate: number

    @Column({
        nullable: false
    })
    activation: boolean
}