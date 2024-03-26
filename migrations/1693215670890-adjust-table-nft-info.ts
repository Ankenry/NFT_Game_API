import { MigrationInterface, QueryRunner } from "typeorm";

export class adjustTableNftInfo1693215670890 implements MigrationInterface {
    name = 'adjustTableNftInfo1693215670890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_info\` ADD \`metadata_attr\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_info\` DROP COLUMN \`metadata_attr\``);
    }

}
