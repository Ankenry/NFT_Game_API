import { Entity, Column, OneToMany } from "typeorm"
import { DefaultEntity } from "./default.entity";
import { nftTrans } from "./nftTrans.entity";

@Entity()
export class nftInfo extends DefaultEntity {
    @Column()
    user_id: number

    @Column({
        nullable: true,
        length: 255
    })
    contract_address: string

    @Column({
        nullable: true,
        length: 255
    })
    owner_address: string

    @Column({
        nullable: true,
    })
    token_id: number

    @Column({
        length: 255
    })
    token_metadata: string

    @Column({
        nullable: true,
        length: 255
    })
    thumbnail: string

    @Column({
        length: 50
    })
    network: string

    @Column()
    is_burn: boolean

    @Column({
        nullable: true,
        length: 5000
    })
    metadata_attr: string

    @OneToMany(() => nftTrans, (nftTrans) => nftTrans.nft_info)
    nftTrans: nftTrans[]
}