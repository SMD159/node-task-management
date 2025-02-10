const swaggerJsDoc = require("swagger-jsdoc");
const path = require("path");

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Task Management API",
            version: "1.0.0",
            description: "Task Management CRUD API with Swagger Documentation"
        }
    },
    apis: [path.join(__dirname, "./routes/*.js")] // Fix path
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const userSchema = {
    name: { type: "string", example: "John Doe" },
    email: { type: "string", example: "john@example.com" },
    password: { type: "string", example: "secret" }
};

const swaggerPaths = {
    "/api/users": {
        post: {
            summary: "Create a new user",
            description: "Adds a new user to the database.",
            tags: ["Users"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { type: "object", properties: userSchema }
                    }
                }
            },
            responses: {
                201: { description: "User created successfully" },
                400: { description: "Bad request, invalid input" }
            }
        },
        get: {
            summary: "Get all users",
            description: "Retrieve a list of users.",
            tags: ["Users"],
            responses: {
                200: { description: "A list of users" },
                500: { description: "Internal server error" }
            }
        }
    },
    "/api/users/{id}": {
        get: {
            summary: "Get user by ID",
            description: "Retrieve a single user by ID.",
            tags: ["Users"],
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" }],
            responses: {
                200: { description: "User found" },
                404: { description: "User not found" }
            }
        },
        put: {
            summary: "Update a user",
            description: "Update a user by ID.",
            tags: ["Users"],
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { type: "object", properties: userSchema }
                    }
                }
            },
            responses: {
                200: { description: "User updated successfully" },
                400: { description: "Bad request, invalid input" }
            }
        },
        delete: {
            summary: "Delete a user",
            description: "Remove a user from the database.",
            tags: ["Users"],
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" }, description: "User ID" }],
            responses: {
                200: { description: "User deleted successfully" },
                404: { description: "User not found" }
            }
        }
    }
};

swaggerDocs.paths = { ...swaggerDocs.paths, ...swaggerPaths };

module.exports = swaggerDocs;
