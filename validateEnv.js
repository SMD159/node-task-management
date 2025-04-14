const Joi = require("joi");
const log = require("./logger");
const envSchema = Joi.object({
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().port().required(),
    DB_USER: Joi.string().required(),
    DB_PASS: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    DB_CLIENT: Joi.string().valid("pg", "mysql", "mssql").required(),
    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().port().required(),
    RABBITMQ_HOST: Joi.string().required(),
    RABBITMQ_PORT: Joi.number().port().required(),
    RABBITMQ_URL: Joi.string().uri().required(),
    SWAGGER_OUTPUT_FILE: Joi.string().required(),
    SWAGGER_ENDPOINT_DIR: Joi.string().required(),
    PORT: Joi.number().port().required(),
    ENV_NAME: Joi.string().required()
}).unknown(true);
function main() {
    const { error } = envSchema.validate(process.env, { abortEarly: false });

    if (error) {
        log.error("Missing or invalid environment variables:");
        error.details.forEach((err) => console.error(`- ${err.message}`));
        process.exit(1);
    }

    log.info("Environment variables validated successfully.");
};

module.exports = main;
