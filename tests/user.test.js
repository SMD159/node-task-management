const request = require("supertest");
const app = require("../app"); // Ensure this is the correct path to your Express app
const knex = require("../knex/index.js");
const redis = require("../redis/user.redis.js");
const amqp = require("amqplib");

beforeAll(async () => {
    await knex.migrate.latest(); // Ensure tables exist
});

afterAll(async () => {
    await knex.destroy(); // Close DB connection after tests
});

jest.mock("../redis/user.redis.js", () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    ping: jest.fn().mockResolvedValue("PONG"), // ✅ Added mock function
    del: jest.fn().mockResolvedValue(1) // ✅ Added mock function
}));

// Mock RabbitMQ
jest.mock("amqplib", () => ({
    connect: jest.fn().mockResolvedValue({
        createChannel: jest.fn().mockResolvedValue({
            assertQueue: jest.fn().mockResolvedValue(true),
            sendToQueue: jest.fn().mockResolvedValue(true)
        })
    })
}));

let rabbitMQChannel;

beforeAll(async () => {
    // Mock RabbitMQ connection
    const rabbitMQConnection = await amqp.connect();
    rabbitMQChannel = await rabbitMQConnection.createChannel();
    await rabbitMQChannel.assertQueue("emailQueue");
});

afterAll(async () => {
    await knex.destroy();
});

describe("User API Endpoints", () => {
    let userId;

    it("should create a new user", async () => {
        const res = await request(app)
            .post("/api/users")
            .send({ name: "John Doe", email: "john@example.com", password: "securePassword123" }); // ✅ Added password

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("id");
        userId = res.body.id;
    });

    it("should fetch all users", async () => {
        const res = await request(app).get("/api/users");
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("should check Redis cache for a user", async () => {
        redis.get.mockResolvedValue(JSON.stringify({ id: userId, name: "John Doe" }));
        const cachedUser = await redis.get(`user:${userId}`);
        expect(JSON.parse(cachedUser)).toHaveProperty("name", "John Doe");
    });

    it("should publish a message to RabbitMQ", async () => {
        const payload = Buffer.from(JSON.stringify({ userId }));
        rabbitMQChannel.sendToQueue("emailQueue", payload);
        expect(rabbitMQChannel.sendToQueue).toHaveBeenCalledWith("emailQueue", payload);
    });

    it("✅ Should fetch a user by ID", async () => {
        if (!userId) {
            const user = await knex("users").select("id", "email").first();
            if (user) userId = user.id;
        }

        const res = await request(app).get(`/api/users/${userId}`);
        expect(res.statusCode).toBe(200);

        console.log("User API Response:", res.body); // Debugging: Check response structure

        // ✅ Ensure both `name` and `email` exist before asserting
        expect(res.body).toHaveProperty("id", userId);
        expect(res.body).toHaveProperty("name");
        expect(res.body).toHaveProperty("email"); // Now email should exist
    });

    it("should return 400 for non-existing user", async () => {
        const res = await request(app).get("/api/users/invalidId123");
        expect(res.statusCode).toBe(400); // ✅ Now correctly returns 400 for an invalid ID
    });

    it("should update a user", async () => {
        const res = await request(app)
            .put(`/api/users/${userId}`)
            .send({ name: "John Updated" });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("name", "John Updated");
    });

    it("should delete a user and check DB removal", async () => {
        console.log(`🗑️  Attempting to delete user with ID: ${userId}`);

        const res = await request(app).delete(`/api/users/${userId}`);

        console.log("DELETE Response:", res.body); // Log response

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("message", "User deleted");

        // Check DB removal
        const user = await knex("users").where({ id: userId }).first();
        expect(user).toBeUndefined();
    });
});
