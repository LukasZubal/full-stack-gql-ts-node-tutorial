import "reflect-metadata"
import { DataSource } from "typeorm"
import * as dotenv from "dotenv"
dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: process.env.PG_USER || "admin",
    password: process.env.PG_PASSWORD || "admin",
    database: "catalog_db",
    synchronize: true,
    logging: true,
    entities: [
        "src/entity/**/*.ts"
    ],
    migrations: [],
    subscribers: [],
})
