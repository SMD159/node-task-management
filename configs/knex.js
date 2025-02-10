const knex = require("knex");
const config = require("../knexfile");
require("dotenv").config({ path: `./envs/.env.${process.env.NODE_ENV || "development"}` });

const environment = process.env.NODE_ENV || "development";
const db = knex(config[environment]);

module.exports = db;
