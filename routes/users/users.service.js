const services = {};
const User = require("../../models/User");
const redis = require("../../configs/redis");
const connectRabbitMQ = require("../../configs/rabbitmq");

// ✅ Function to publish messages to RabbitMQ
async function publishToQueue(queue, message) {
    const channel = await connectRabbitMQ();
    await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
}

services.createUser = async (data) => {
    const user = await User.query().insert(data);

    // Verify Redis connection
    // redis.ping()
    //     .then(response => console.log("Redis PING Response:", response))
    //     .catch(console.error);

    // Log Redis command before execution
    console.log("Saving user in Redis:", `user:${user.id}`, JSON.stringify(user));

    // Store user in Redis Cache for 1 hour
    await redis.set(`user:${user.id}`, JSON.stringify(user), "EX", 3600)
        .then(() => console.log("✅ User cached successfully"))
        .catch((err) => console.error("❌ Redis error:", err));

    return user;
};

// ✅ Fetch all users (Cache Not Needed)
services.getAllUsers = async () => {
    return User.query();
};

// ✅ Fetch a user by ID (with Redis Cache)
services.getUserById = async (id) => {
    // Check Redis Cache first
    const cachedUser = await redis.get(`user:${id}`);
    if (cachedUser) return JSON.parse(cachedUser);

    // Fetch from Database if not in cache
    const user = await User.query().select("id", "name", "email").findById(id); // ✅ Include email
    redis.ping().then(console.log).catch(console.error);

    if (user) await redis.set(`user:${id}`, JSON.stringify(user), "EX", 3600);

    return user;
};

// ✅ Update a user (Invalidate Cache)
services.updateUser = async (id, data) => {
    const updatedUser = await User.query().patchAndFetchById(id, data);

    // Update cache
    redis.ping().then(console.log).catch(console.error);

    await redis.set(`user:${id}`, JSON.stringify(updatedUser), "EX", 3600);

    return updatedUser;
};

// ✅ Delete a user (Clear Cache & Notify RabbitMQ)
services.deleteUser = async (id) => {
    await User.query().deleteById(id);

    // Remove from Redis
    await redis.del(`user:${id}`);

    // Publish user deletion event to RabbitMQ
    await publishToQueue("user_deleted", { id });

    return { message: "User deleted" };
};
module.exports = services;
