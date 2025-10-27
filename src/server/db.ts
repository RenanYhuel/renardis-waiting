import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "db.sqlite");

export async function getDb() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
    });

    // Initialize tables if needed
    await db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      phone TEXT,
      linkedIn TEXT,
      availability TEXT,
      specialty TEXT,
      coverLetter TEXT,
      cvFilename TEXT,
      cvOriginalName TEXT,
      status TEXT DEFAULT 'Nouvelle candidature',
      notes TEXT DEFAULT '[]',
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT,
      createdAt TEXT
    );
  `);

    return db;
}

export default getDb;
