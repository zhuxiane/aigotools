import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

declare global {
  // 为了防止 TypeScript 报错，声明一个全局变量
  var _db: any;
}

let db;

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;

if (process.env.NODE_ENV === "production") {
  // 生产环境，连接到 Turso 数据库
  if (!TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL is not defined");
  }

  db = createClient({
    url: TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
} else {
  // 开发环境，使用全局变量防止多次创建连接
  if (!global._db) {
    if (!TURSO_DATABASE_URL) {
      throw new Error("TURSO_DATABASE_URL is not defined");
    }
    global._db = createClient({
      url: TURSO_DATABASE_URL,
    });
  }
  db = global._db;
}

const drizzleDb = drizzle(db, { logger: true });

export default drizzleDb;
