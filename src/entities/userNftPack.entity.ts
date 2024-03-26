import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftPack } from "./nftPack.entity";

@Entity("user_nft_packs")
export class userNftPack extends DefaultEntity {
    @ManyToOne(() => nftPack, (nftPack) => nftPack.id)
    @JoinColumn({
        name: "nft_pack_id",
    })
    nft_pack: nftPack;

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
    status: string  // NEW/OPENED/EXPIRED
}