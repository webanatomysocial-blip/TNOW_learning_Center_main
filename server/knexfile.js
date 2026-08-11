const path = require("node:path");
// dotenv defaults to loading ".env" from process.cwd(), which on cPanel/Passenger
// isn't guaranteed to be this file's directory — point it here explicitly, same as
// server/index.js. Doesn't override already-set process.env vars either way.
require("dotenv").config({ path: path.join(__dirname, ".env") });

const productionConnection = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "togglenow_cms",
    };

module.exports = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.join(__dirname, "dev.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, "migrations"),
    },
    seeds: {
      directory: path.join(__dirname, "seeds"),
    },
  },
  production: {
    client: "mysql2",
    connection: productionConnection,
    migrations: {
      directory: path.join(__dirname, "migrations"),
    },
    seeds: {
      directory: path.join(__dirname, "seeds"),
    },
  },
};
