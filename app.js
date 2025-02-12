require("./init")();

const express = require("express");
const userRoutes = require("./routes/index");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

const app = express();

app
    .use(express.json())
    .use("/api", userRoutes)
    .use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

module.exports = app;
