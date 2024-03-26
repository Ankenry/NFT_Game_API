import { Entity, Column, ManyToOne, JoinColumn } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftGame } from "./nftGame.entity";

@Entity("nft_items")
export class nftItem extends DefaultEntity {
    @ManyToOne(() => nftGame, (nftGame) => nftGame.id)
    @JoinColumn({
        name: "nft_game_id",
    })
    nft_game: nftGame | string | undefined;

    @Column({
        nullable: false,
    })
    rarity: number

    @Column({
        nullable: true,
    })
    thumbnail_url: string

    @Column({
        nullable: true,
    })
    metadata_url: string

    @Column({
        nullable: false
    })
    activation: boolean

    @Column({
        length: 50,
        nullable: true,
    })
    status: string

    @Column({
        nullable: false,
    })
    name: string

    @Column({
        nullable: true,
    })
    description: string
}