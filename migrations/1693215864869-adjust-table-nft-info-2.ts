import { MigrationInterface, QueryRunner } from "typeorm";

export class adjustTableNftInfo21693215864869 implements MigrationInterface {
    name = 'adjustTableNftInfo21693215864869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_info\` CHANGE \`metadata_attr\` \`metadata_attr\` varchar(5000) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_info\` CHANGE \`metadata_attr\` \`metadata_attr\` varchar(5000) NOT NULL`);
    }

}
