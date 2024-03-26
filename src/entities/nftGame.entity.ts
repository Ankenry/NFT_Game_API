import { Entity, Column } from "typeorm"
import { DefaultEntity } from "./default.entity";

@Entity("nft_games")
export class nftGame extends DefaultEntity {
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
    ref_game_id: number

    @Column({
        nullable: true,
    })
    ref_url: string

    @Column({
        nullable: false
    })
    activation: boolean
}