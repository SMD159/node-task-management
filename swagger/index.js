module.exports = {
    info: {
        title: "Task Management API",
        description: "Task Management CRUD API with Swagger Documentation",
        version: "1.0.0"
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local Development Server"
        }
    ],
    tags: [
        { name: "Users", description: "User management routes" },
        { name: "Tasks", description: "Task management routes" }
    ],
    paths: {} // swagger-autogen will populate this
};
