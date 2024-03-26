import { MigrationInterface, QueryRunner } from "typeorm";

export class adjustTableNftInfo11693215779022 implements MigrationInterface {
    name = 'adjustTableNftInfo11693215779022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_info\` DROP COLUMN \`metadata_attr\``);
        await queryRunner.query(`ALTER TABLE \`nft_info\` ADD \`metadata_attr\` varchar(5000) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_info\` DROP COLUMN \`metadata_attr\``);
        await queryRunner.query(`ALTER TABLE \`nft_info\` ADD \`metadata_attr\` varchar(255) NOT NULL`);
    }
}
