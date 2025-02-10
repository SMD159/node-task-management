// require("dotenv").config();
require("dotenv").config({ path: "./envs/.env" });

module.exports = {
    development: {
        client: "pg",
        connection: {
            host: process.env.DB_HOST || "localhost", // Ensure this is "postgres" in Docker
            user: process.env.DB_USER || "user",
            password: process.env.DB_PASSWORD || "password",
            database: process.env.DB_NAME || "mydatabase",
            port: process.env.DB_PORT || 5432
        },
        migrations: {
            directory: "./db/migrations"
        },
        seeds: {
            directory: "./db/seeds"
        }
    },
    test: {
        client: "sqlite3",
        connection: {
            filename: ":memory:"
        },
        useNullAsDefault: true,
        migrations: {
            directory: "./db/migrations"
        },
        seeds: {
            directory: "./db/seeds"
        }
    }

};
