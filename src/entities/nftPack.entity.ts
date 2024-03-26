import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftGame } from "./nftGame.entity";

@Entity("nft_packs")
export class nftPack extends DefaultEntity {
    @ManyToOne(() => nftGame, (nftGame) => nftGame.id)
    @JoinColumn({
        name: "nft_game_id",
    })
    nft_game: nftGame | string | undefined;

    @Column({
        length: 255,
        nullable: false,
    })
    fullname: string

    @Column({
        nullable: true,
        length: 5000
    })
    description: string

    @Column({
        nullable: true,
    })
    thumbnail: string

    @Column({
        nullable: false,
    })
    inclusion_count: number
    
    @Column({
        nullable: false,
    })
    remain_count: number

    @Column({
        nullable: false
    })
    activation: boolean

    @Column({
        nullable: false
    })
    is_delete: boolean
}