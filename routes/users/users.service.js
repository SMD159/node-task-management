const User = require("../../models/user.model");
const redis = require("../../redis/user.redis");
const connectRabbitMQ = require("../../rabbitmq/user.rabbitmq");

class UserService {
    async publishToQueue(queue, message) {
        const channel = await connectRabbitMQ();
        await channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    }

    async createUser(data) {
        const user = await User.query().insert(data);
        console.log("Saving user in Redis:", `user:${user.id}`, JSON.stringify(user));

        await redis.set(`user:${user.id}`, JSON.stringify(user), "EX", 3600)
            .then(() => console.log("✅ User cached successfully"))
            .catch((err) => console.error("❌ Redis error:", err));

        return user;
    }

    async getAllUsers() {
        return User.query();
    }

    async getUserById(id) {
        const cachedUser = await redis.get(`user:${id}`);
        if (cachedUser) return JSON.parse(cachedUser);

        const user = await User.query().select("id", "name", "email").findById(id);
        redis.ping().then(console.log).catch(console.error);

        if (user) await redis.set(`user:${id}`, JSON.stringify(user), "EX", 3600);

        return user;
    }

    async updateUser(id, data) {
        const updatedUser = await User.query().patchAndFetchById(id, data);
        redis.ping().then(console.log).catch(console.error);

        await redis.set(`user:${id}`, JSON.stringify(updatedUser), "EX", 3600);

        return updatedUser;
    }

    async deleteUser(id) {
        await User.query().deleteById(id);
        await redis.del(`user:${id}`);
        await this.publishToQueue("user_deleted", { id });

        return { message: "User deleted" };
    }
}

module.exports = new UserService();
