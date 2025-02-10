const http = require("http");
const swaggerAutogen = require("swagger-autogen")({ openapi: process.env.SWAGGER_VERSION });
const app = require("./app");

// const {
//     SWAGGER_OUTPUT_FILE,
//     SWAGGER_ENDPOINT_DIR,
//     PORT
// } = process.env;

async function main() {
    const swaggerOutputFile = process.env.SWAGGER_OUTPUT_FILE || "./swagger-output.json";
    const swaggerEndpointDir = process.env.SWAGGER_ENDPOINT_DIR || "./routes/*.js";
    const PORT = process.env.PORT || 3000;
    await swaggerAutogen(swaggerOutputFile, [swaggerEndpointDir], require("./swagger/index"));

    app.set("port", PORT);
    http.createServer(app).listen(PORT, () => console.log(`server is listening on : http://localhost:${PORT}`));
}

main();
