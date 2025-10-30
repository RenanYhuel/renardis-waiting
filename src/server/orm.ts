import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { Candidate } from "./entities/Candidate";
import { File } from "./entities/File";
import { RecruiterAccess } from "./entities/RecruiterAccess";

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "typeorm.sqlite");

// IMPORTANT: avoid dynamic glob strings here because Next's bundler
// will try to resolve them at build time and fail. Import entity
// classes explicitly and pass them to TypeORM so the bundler can
// include the referenced modules correctly.
export const AppDataSource = new DataSource({
    type: "sqlite",
    database: DB_FILE,
    synchronize: true, // for development; consider migrations for production
    logging: false,
    entities: [Candidate, File, RecruiterAccess],
});

export async function initializeOrm() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    return AppDataSource;
}
