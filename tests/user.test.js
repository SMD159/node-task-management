const UserService = require("../routes/users/users.service"); // Import the service
const User = require("../models/user.model"); // Import User model
const redis = require("../redis/user.redis"); // Mock Redis
const rabbitMQ = require("../rabbitmq/user.rabbitmq"); // Mock RabbitMQ

jest.mock("../redis/user.redis.js", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ping: jest.fn()
}));

jest.mock("../rabbitmq/user.rabbitmq", () => ({
    connect: jest.fn().mockResolvedValue({
        sendToQueue: jest.fn().mockResolvedValue(true)
    })
}));

describe("UserService", () => {
    let mockUser;

    beforeAll(() => {
        mockUser = {
            id: 1,
            name: "John Doe",
            email: "johndoe@example.com",
            password: "securePassword123"
        };
    });

    afterEach(() => {
        jest.clearAllMocks(); // Reset mocks after each test
    });

    it("should create a new user and cache it in Redis", async () => {
        jest.spyOn(User, "query").mockReturnValue({
            insert: jest.fn().mockResolvedValue(mockUser)
        });

        const user = await UserService.createUser(mockUser);

        expect(user).toEqual(mockUser);
        expect(redis.set).toHaveBeenCalledWith(
            `user:${user.id}`,
            JSON.stringify(user),
            "EX",
            3600
        );
        expect(rabbitMQ.connect().sendToQueue).toHaveBeenCalledWith(
            "user_created",
            Buffer.from(JSON.stringify({ id: user.id, name: user.name, email: user.email }))
        );
    });

    // ✅ Get All Users
    it("should return all users", async () => {
        jest.spyOn(User, "query").mockReturnValue({
            select: jest.fn().mockResolvedValue([mockUser])
        });

        const users = await UserService.getAllUsers();
        expect(users).toEqual([mockUser]);
    });

    // ✅ Get User By ID (with Redis caching)

    // ✅ Get User By ID (from database when not cached)
    it("should fetch a user from the database when not in Redis", async () => {
        redis.get.mockResolvedValue(null);

        jest.spyOn(User, "query").mockReturnValue({
            select: jest.fn().mockResolvedValue([mockUser]),
            findById: jest.fn().mockResolvedValue(mockUser)
        });

        const user = await UserService.getUserById(mockUser.id);

        expect(User.query().findById).toHaveBeenCalledWith(mockUser.id);
        expect(redis.set).toHaveBeenCalledWith(
            `user:${mockUser.id}`,
            JSON.stringify(mockUser),
            "EX",
            3600
        );
        expect(user).toEqual(mockUser);
    });

    // ✅ Update User
    it("should update a user and refresh Redis cache", async () => {
        const updatedUser = { ...mockUser, name: "John Updated" };

        jest.spyOn(User, "query").mockReturnValue({
            patchAndFetchById: jest.fn().mockResolvedValue(updatedUser)
        });

        const user = await UserService.updateUser(mockUser.id, { name: "John Updated" });

        expect(User.query().patchAndFetchById).toHaveBeenCalledWith(mockUser.id, { name: "John Updated" });
        expect(redis.set).toHaveBeenCalledWith(
            `user:${mockUser.id}`,
            JSON.stringify(updatedUser),
            "EX",
            3600
        );
        expect(user).toEqual(updatedUser);
    });

    // ✅ Delete User
    it("should delete a user, remove from Redis, and publish event to RabbitMQ", async () => {
        jest.spyOn(User, "query").mockReturnValue({
            findById: jest.fn().mockResolvedValue(mockUser),
            deleteById: jest.fn().mockResolvedValue(1)
        });

        redis.del.mockResolvedValue(1);

        const response = await UserService.deleteUser(mockUser.id);

        expect(User.query().findById).toHaveBeenCalledWith(mockUser.id);
        expect(User.query().deleteById).toHaveBeenCalledWith(mockUser.id);
        expect(redis.del).toHaveBeenCalledWith(`user:${mockUser.id}`);
        expect(rabbitMQ.connect().sendToQueue).toHaveBeenCalledWith(
            "user_deleted",
            Buffer.from(JSON.stringify({ id: mockUser.id }))
        );
        expect(response).toEqual({ message: "User deleted" });
    });

    it("should return a user from Redis cache", async () => {
        redis.get.mockResolvedValue(JSON.stringify(mockUser));

        const user = await UserService.getUserById(mockUser.id);

        expect(redis.get).toHaveBeenCalledWith(`user:${mockUser.id}`);
        expect(user).toEqual(mockUser);
    });
    // ❌ Delete Non-Existing User (Error Case)
    it("should throw an error if the user does not exist", async () => {
        jest.spyOn(User, "query").mockReturnValue({
            findById: jest.fn().mockResolvedValue(null)
        });

        await expect(UserService.deleteUser(99)).rejects.toThrow("User not found");
    });
});
