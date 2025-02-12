require("dotenv").config(); // Ensure dotenv is loaded at the beginning

const { Model, knexSnakeCaseMappers } = require("objection");
const log = require("../logger");

const {
    DB_CLIENT,
    DB_NAME,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASS
} = process.env;

// Log environment variables before initializing Knex
console.log("DB_CLIENT:", DB_CLIENT);
console.log("DB_NAME:", DB_NAME);
console.log("DB_HOST:", DB_HOST);
console.log("DB_PORT:", DB_PORT);
console.log("DB_USER:", DB_USER);
console.log("DB_PASS:", DB_PASS);
log.info({
    DB_CLIENT,
    DB_NAME,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASS

});
if (!DB_CLIENT) {
    throw new Error("Missing required environment variable: DB_CLIENT");
}

const knexPostgis = require("knex-postgis");

const db = require("knex")({
    client: DB_CLIENT,
    connection: {
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASS,
        database: DB_NAME
    },
    pool: {
        min: 5,
        max: 50
    },
    ...knexSnakeCaseMappers()
});

Model.knex(db);

module.exports = db;
