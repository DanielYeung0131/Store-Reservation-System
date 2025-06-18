// lib/db.ts
import mysql from "mysql2/promise";

// DB_HOST=store-reservation-system.cfa0is4ckgb5.us-east-2.rds.amazonaws.com
// DB_PORT=3306
// DB_USER=admin
// DB_PASSWORD=Daniel0131!
// DB_NAME=reservation_db

const pool = mysql.createPool({
  host: "store-reservation-system.cfa0is4ckgb5.us-east-2.rds.amazonaws.com",
  port: 3306,
  user: "admin",
  password: "Daniel0131!",
  database: "reservation_db",
});

export default pool;
