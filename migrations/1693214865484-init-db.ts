import { MigrationInterface, QueryRunner } from "typeorm";

export class initDb1693214865484 implements MigrationInterface {
    name = 'initDb1693214865484'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`nft_trans\` (\`id\` varchar(36) NOT NULL, \`is_delete\` tinyint NOT NULL DEFAULT 0, \`created_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`modified_date\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`txhash\` varchar(255) NULL, \`from\` varchar(255) NULL, \`to\` varchar(255) NULL, \`trans_type\` varchar(50) NOT NULL, \`nft_info_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`nft_info\` (\`id\` varchar(36) NOT NULL, \`is_delete\` tinyint NOT NULL DEFAULT 0, \`created_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`modified_date\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NOT NULL, \`owner_address\` varchar(255) NULL, \`token_id\` int NULL, \`token_metadata\` varchar(255) NOT NULL, \`thumbnail\` varchar(255) NULL, \`network\` varchar(50) NOT NULL, \`is_burn\` tinyint NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`nft_trans\` ADD CONSTRAINT \`FK_d21d0daf2262bb12ed302695d93\` FOREIGN KEY (\`nft_info_id\`) REFERENCES \`nft_info\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_trans\` DROP FOREIGN KEY \`FK_d21d0daf2262bb12ed302695d93\``);
        await queryRunner.query(`DROP TABLE \`nft_info\``);
        await queryRunner.query(`DROP TABLE \`nft_trans\``);
    }

}
