import { DataSource } from "typeorm"
require('dotenv').config()

export const ormconfig = new DataSource({
    type: "mysql",
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_POST),
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    logging: false,
    synchronize: true,
    entities: [
        __dirname + '/entities/**/*.entity{.ts,.js}'
      ],
    migrations: [__dirname + `/migrations/**/*.{js,ts}`],
    migrationsRun: true,
})