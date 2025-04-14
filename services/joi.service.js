class service {
    validateSchema(schema) {
        return (value, helpers) => {
            try {
                const parsed = JSON.parse(value);
                const { error, value: validatedValue } = schema.validate(parsed);
                if (error) {
                    return helpers.error("any.invalid", { message: error.message });
                }

                return JSON.stringify(validatedValue);
            } catch (error) {
                return helpers.error("any.invalid", { message: `Parsing error: ${error.message}` });
            }
        };
    }
}
module.exports = new service();
