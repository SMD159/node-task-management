"use strict";

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const userRoutes = require("./routes/index");
const swaggerDocs = require("./configs/swaggerDocs");
const path = require("path");
require("dotenv").config({ path: "./envs/.env" });

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);

const app = express();

app
    .use(express.json())
    .use("/api", userRoutes)
    .use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

module.exports = app;
