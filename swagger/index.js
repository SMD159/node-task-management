module.exports = {
    openapi: process.env.SWAGGER_VERSION,
    info: {
        title: "Task Management Application",
        version: process.env.SWAGGER_DOC_VERSION,
        description: "Complete node task",
        contact: {
            name: "",
            url: "",
            email: ""
        }
    },
    servers: [
        {
            url: process.env.SWAGGER_BASE_API ? process.env.SWAGGER_BASE_API : "/",
            description: "Server 1"
        },
        {
            url: `http://localhost:${process.env.PORT}`,
            description: "Server 2"
        }
    ],
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    tags: [],
    definitions: {
        responseObject: {
            success: true,
            message: "success",
            data: {}
        },

        responseArray: {
            success: true,
            message: "success",
            data: []
        }

    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            },
            basicAuth: {
                type: "http",
                scheme: "basic"
            }
        }
    },
    security: [
        {
            bearerAuth: [],
            basicAuth: []
        }
    ]
};
