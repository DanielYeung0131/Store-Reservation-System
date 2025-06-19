// lib/db.ts
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.NEXT_PUBLIC_DB_HOST,
  port: process.env.NEXT_PUBLIC_DB_PORT
    ? Number(process.env.NEXT_PUBLIC_DB_PORT)
    : undefined,
  user: process.env.NEXT_PUBLIC_DB_USER,
  password: process.env.NEXT_PUBLIC_DB_PASSWORD,
  database: process.env.NEXT_PUBLIC_DB_NAME,
});

export default pool;
