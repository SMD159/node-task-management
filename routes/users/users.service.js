const User = require("../../models/user.model");
const redis = require("../../redis/user.redis");
const rabbitMQ = require("../../rabbitmq/user.rabbitmq");

class UserService {
    async publishToQueue(queue, message) {
        try {
            const channel = await rabbitMQ.connect();
            if (!channel) {
                console.error("RabbitMQ channel not available.");
                return;
            }

            await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
            console.log(`Published event to RabbitMQ: ${queue}`);
        } catch (error) {
            console.error("Error publishing to RabbitMQ:", error);
        }
    }

    async createUser(data) {
        try {
            const user = await User.query().insert(data);
            console.log("Saving user in Redis:", `user:${user.id}`, JSON.stringify(user));

            // Handle Redis caching with try-catch instead of chaining
            try {
                await redis.set(`user:${user.id}`, JSON.stringify(user), "EX", 3600);
                console.log("User cached successfully");
            } catch (err) {
                console.error("Redis error:", err);
            }

            await this.publishToQueue("user_created", {
                id: user.id,
                name: user.name,
                email: user.email
            });

            return user;
        } catch (error) {
            console.error("Error creating user:", error);
            throw new Error(error.message);
        }
    }

    async getUsers(payload) {
        if (payload?.id) {
            const cachedUser = await redis.get(`user:${payload.id}`);
            if (cachedUser) return JSON.parse(cachedUser);

            const user = await User.query().select("id", "name", "email").findById(payload.id);
            if (!user) {
                return {
                    success: false,
                    responseCode: 404,
                    message: payload.id ? "User not found" : "No users available",
                    data: null
                };
            }
            await redis.set(`user:${payload.id}`, JSON.stringify(user), "EX", 3600);

            return user;
        } else {
            return await User.query();
        }
    }

    async updateUser(id, data) {
        const updatedUser = await User.query().patchAndFetchById(id, data);
        if (!updatedUser) {
            throw new Error("User not found");
        }

        await redis.set(`user:${id}`, JSON.stringify(updatedUser), "EX", 3600);
        return updatedUser;
    }

    async deleteUser(id) {
        console.log(`Attempting to delete user with ID: ${id}`);

        const user = await User.query().findById(id);
        if (!user) {
            console.error(`User with ID ${id} not found`);
            throw new Error("User not found");
        }

        await User.query().deleteById(id);
        console.log(`User with ID ${id} deleted from database`);

        await redis.del(`user:${id}`);
        console.log("User removed from Redis cache");

        await this.publishToQueue("user_deleted", { id });

        return { message: "User deleted" };
    }
}

module.exports = new UserService();
