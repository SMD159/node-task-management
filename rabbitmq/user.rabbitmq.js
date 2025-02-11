const amqp = require("amqplib");
require("dotenv").config({ path: "./envs/.env" });

class UserRabbitMQ {
    constructor() {
        this.channel = null;
    }

    async connect() {
        if (!process.env.RABBITMQ_HOST) {
            throw new Error("🚨 RABBITMQ_HOST is not set in .env. Please configure it.");
        }

        try {
            const rabbitmqHost = process.env.RABBITMQ_HOST;
            const connection = await amqp.connect(`amqp://${rabbitmqHost}`);
            this.channel = await connection.createChannel();
            await this.channel.assertQueue("user_created");
            await this.channel.assertQueue("user_deleted");
            console.log("✅ Connected to RabbitMQ");
        } catch (error) {
            console.error("❌ RabbitMQ Connection Failed:", error.message);
            this.channel = null;
        }

        return this.channel;
    }
}

// ✅ Ensure we are exporting an **instance** of the class
module.exports = new UserRabbitMQ();
