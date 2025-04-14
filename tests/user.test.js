jest.mock("amqplib", () => ({
    connect: jest.fn()
}));
jest.mock("../rabbitmq/user.rabbitmq", () => ({
    connect: jest.fn().mockResolvedValue({
        sendToQueue: jest.fn().mockResolvedValue(true)
    })
}));
jest.mock("../redis/user.redis", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ping: jest.fn()
}));
const amqp = require("amqplib");

const UserRabbitMQ = require("../rabbitmq/user.rabbitmq");

const UserService = require("../routes/users/users.service");
const UserController = require("../routes/users/users.controller");
const log = require("../logger");
const User = require("../models/user.model");
const redis = require("../redis/user.redis");
const rabbitMQ = require("../rabbitmq/user.rabbitmq");

describe("UserService", () => {
    let mockUser;
    let mockChannel;
    let mockConnection;
    beforeAll(() => {
        mockUser = {
            id: 1,
            name: "John Doe",
            email: "johndoe@example.com",
            password: "securePassword123"
        };
    });

    // beforeEach(() => {
    //     jest.clearAllMocks();
    //     mockChannel = {
    //         sendToQueue: jest.fn().mockResolvedValue(true)
    //     };
    //     rabbitMQ.connect.mockResolvedValue(mockChannel);
    // });
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock RabbitMQ channel and connection
        mockChannel = {
            sendToQueue: jest.fn().mockResolvedValue(true),
            assertQueue: jest.fn().mockResolvedValue(true),
            close: jest.fn().mockResolvedValue()
        };

        mockConnection = {
            createChannel: jest.fn().mockResolvedValue(mockChannel),
            close: jest.fn().mockResolvedValue()
        };

        amqp.connect.mockResolvedValue(mockConnection);
        rabbitMQ.connect.mockResolvedValue(mockChannel);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ================== publishToQueue ==================
    describe("publishToQueue", () => {
        it("should successfully connect to RabbitMQ and assert queues", async () => {
            process.env.RABBITMQ_HOST = "localhost";

            const channel = await rabbit.connect();

            expect(amqp.connect).toHaveBeenCalledWith("amqp://localhost");
            expect(mockConnection.createChannel).toHaveBeenCalled();
            expect(mockChannel.assertQueue).toHaveBeenCalledWith("user_created");
            expect(mockChannel.assertQueue).toHaveBeenCalledWith("user_deleted");
            expect(channel).toBe(mockChannel);
        });

        // ✅ Handle missing RABBITMQ_HOST
        it("should throw an error if RABBITMQ_HOST is not set", async () => {
            delete process.env.RABBITMQ_HOST;

            await expect(UserRabbitMQ.connect()).rejects.toThrow(
                "🚨 RABBITMQ_HOST is not set in .env. Please configure it."
            );

            // Ensure no connection attempt is made
            expect(amqp.connect).not.toHaveBeenCalled();
        });

        it("should successfully publish a message to the RabbitMQ queue", async () => {
            const queue = "user_created";
            const message = { id: 1, name: "John Doe" };

            await UserService.publishToQueue(queue, message);

            expect(rabbitMQ.connect).toHaveBeenCalled();
            expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
                queue,
                Buffer.from(JSON.stringify(message))
            );
        });

        it("should log an error if the RabbitMQ channel is not available", async () => {
            console.error = jest.fn();
            rabbitMQ.connect.mockResolvedValue(null);

            await UserService.publishToQueue("user_created", { id: 1 });

            expect(rabbitMQ.connect).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith("RabbitMQ channel not available.");
            expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
        });

        it("should handle and log errors if message publishing fails", async () => {
            console.error = jest.fn();
            mockChannel.sendToQueue.mockRejectedValue(new Error("Queue error"));

            await UserService.publishToQueue("user_created", { id: 1 });

            expect(console.error).toHaveBeenCalledWith(
                "Error publishing to RabbitMQ:",
                expect.any(Error)
            );
        });

        it("should handle and log errors if RabbitMQ connection fails", async () => {
            console.error = jest.fn();
            rabbitMQ.connect.mockRejectedValue(new Error("Connection error"));

            await UserService.publishToQueue("user_created", { id: 1 });

            expect(rabbitMQ.connect).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith(
                "Error publishing to RabbitMQ:",
                expect.any(Error)
            );
        });
    });

    // ================== createUser ==================
    describe("createUser", () => {
        it("should create a new user and cache it in Redis", async () => {
            jest.spyOn(User, "query").mockReturnValue({
                insert: jest.fn().mockResolvedValue(mockUser)
            });

            redis.set.mockResolvedValue("OK");

            const user = await UserService.createUser(mockUser);

            expect(user).toEqual(mockUser);
            expect(redis.set).toHaveBeenCalledWith(
                `user:${user.id}`,
                JSON.stringify(user),
                "EX",
                3600
            );
            expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
                "user_created",
                Buffer.from(JSON.stringify({ id: user.id, name: user.name, email: user.email }))
            );
        });

        it("should handle Redis caching failure gracefully", async () => {
            jest.spyOn(User, "query").mockReturnValue({
                insert: jest.fn().mockResolvedValue(mockUser)
            });
            redis.set.mockRejectedValue("Redis error");

            const user = await UserService.createUser(mockUser);

            expect(user).toEqual(mockUser);
            expect(redis.set).toHaveBeenCalled();
        });

        it("should throw an error if user creation fails in the database", async () => {
            jest.spyOn(User, "query").mockReturnValue({
                insert: jest.fn().mockRejectedValue(new Error("Database error"))
            });

            await expect(UserService.createUser(mockUser)).rejects.toThrow("Database error");
        });
    });

    // ================== getUserById ==================

    describe("UserController - getUsers", () => {
        it("should return a validation error for invalid id format", async () => {
            const result = await UserController.getUsers({ id: 1 });

            expect(result).toEqual({
                success: false,
                responseCode: 900,
                message: "Invalid user ID format",
                data: null
            });
        });

        // === Cache Hit ===
        it("should return a user from cache if available", async () => {
            redis.get.mockResolvedValue(JSON.stringify(mockUser));
            const result = await UserService.getUsers({ id: "1" });
            expect(redis.get).toHaveBeenCalledWith("user:1");
            expect(result).toEqual(mockUser);
        });

        // === Cache Miss and Fetch from DB ===

        it("should fetch user from database and cache it if not in Redis", async () => {
            redis.get.mockResolvedValue(null);
            const findByIdMock = jest.fn().mockResolvedValue(mockUser);
            jest.spyOn(User, "query").mockReturnValue({
                select: jest.fn().mockReturnThis(),
                findById: findByIdMock
            });

            // Call the service method
            const user = await UserService.getUsers({ id: "1" });

            expect(redis.set).toHaveBeenCalledWith(
                `user:${user.id}`,
                JSON.stringify(user),
                "EX",
                3600
            );
            expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
                "user_created",
                Buffer.from(JSON.stringify({ id: user.id, name: user.name, email: user.email }))
            );
        });

        // ✅ 2. Should return "User not found" if no user exists in DB with ID
        it("should return 404 if user is not found in the database", async () => {
            // Mock cache miss
            redis.get.mockResolvedValue(null);

            // Mock database miss (user not found)
            jest.spyOn(User, "query").mockReturnValue({
                select: jest.fn().mockReturnThis(),
                findById: jest.fn().mockResolvedValue(null)
            });

            const result = await UserService.getUsers({ id: "999" });

            // Ensure cache and database were checked
            expect(redis.get).toHaveBeenCalledWith("user:999");
            expect(User.query().select().findById).toHaveBeenCalledWith("999");

            // Ensure the correct error response is returned
            expect(result).toEqual({
                success: false,
                responseCode: 404,
                message: "User not found",
                data: null
            });

            // Ensure user is NOT cached in Redis
            expect(redis.set).not.toHaveBeenCalled();
        });
        // === Fetch All Users ===
        it("should return all users when no id is provided", async () => {
            const allUsers = [mockUser, { id: "2", name: "Jane Doe", email: "jane@example.com" }];
            UserService.getUsers.mockResolvedValue(allUsers); // Mock DB response

            const result = await UserController.getUsers();

            expect(UserService.getUsers).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(allUsers);
        });

        // === Redis Error ===
        it("should still return a user if Redis cache saving fails", async () => {
            // Simulate cache miss (no user in cache)
            redis.get.mockResolvedValue(null);

            // Simulate a successful database fetch
            jest.spyOn(User, "query").mockReturnValue({
                select: jest.fn().mockReturnThis(),
                findById: jest.fn().mockResolvedValue(mockUser)
            });

            // Simulate Redis cache save failure
            redis.set.mockRejectedValue("Redis error");

            // Call the method
            const result = await UserService.getUsers({ id: "1" });

            // Ensure cache lookup was performed
            expect(redis.get).toHaveBeenCalledWith("user:1");

            // Ensure database query was performed
            expect(User.query().select().findById).toHaveBeenCalledWith("1");

            // Ensure it still returns the user from the database
            expect(result).toEqual(mockUser);

            // Ensure it attempted to cache the user but failed
            expect(redis.set).toHaveBeenCalledWith(
                "user:1",
                JSON.stringify(mockUser),
                "EX",
                3600
            );
        });
        // === Database Error ===
        it("should return an error if database query fails", async () => {
            redis.get.mockResolvedValue(null); // Cache miss
            const dbError = new Error("DB failure");
            UserService.getUsers.mockRejectedValue(dbError);

            const result = await UserController.getUsers({ id: "1" });

            expect(log.error).toHaveBeenCalledWith(dbError);
            expect(result).toEqual({
                success: false,
                responseCode: 900,
                message: "DB failure",
                data: null
            });
        });
    });

    // ================== updateUser ==================
    describe("updateUser", () => {
        it("should update a user and refresh Redis cache", async () => {
            const updatedUser = { ...mockUser, name: "John Updated" };
            jest.spyOn(User, "query").mockReturnValue({
                patchAndFetchById: jest.fn().mockResolvedValue(updatedUser)
            });

            const user = await UserService.updateUser(mockUser.id, { name: "John Updated" });

            expect(user).toEqual(updatedUser);
            expect(redis.set).toHaveBeenCalled();
        });

        it("should throw an error if the user does not exist", async () => {
            jest.spyOn(User, "query").mockReturnValue({
                patchAndFetchById: jest.fn().mockResolvedValue(null)
            });

            await expect(UserService.updateUser(99, {})).rejects.toThrow("User not found");
        });
    });

    // ================== deleteUser ==================
    describe("deleteUser", () => {
        it("should delete a user and publish event to RabbitMQ", async () => {
            jest.spyOn(User, "query").mockReturnValue({
                findById: jest.fn().mockResolvedValue(mockUser),
                deleteById: jest.fn().mockResolvedValue(1)
            });

            const result = await UserService.deleteUser(mockUser.id);

            expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
                "user_deleted",
                Buffer.from(JSON.stringify({ id: mockUser.id }))
            );
            expect(result).toEqual({ message: "User deleted" });
        });

        it("should throw an error if user deletion fails", async () => {
            jest.spyOn(User, "query").mockReturnValue({
                findById: jest.fn().mockResolvedValue(mockUser),
                deleteById: jest.fn().mockRejectedValue(new Error("Delete error"))
            });

            await expect(UserService.deleteUser(mockUser.id)).rejects.toThrow("Delete error");
        });
    });
});
