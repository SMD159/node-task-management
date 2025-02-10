const amqp = require("amqplib");

class UserRabbitMQ {
    constructor() {
        this.channel = null;
    }

    async connect() {
        if (!process.env.RABBITMQ_HOST) {
            console.log("🚀 Skipping RabbitMQ connection (not configured). ");
            return null;
        }

        try {
            const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq";
            const connection = await amqp.connect(`amqp://${rabbitmqHost}`);
            this.channel = await connection.createChannel();
            await this.channel.assertQueue("user_created");
            await this.channel.assertQueue("user_deleted");
            console.log("✅ Connected to RabbitMQ");
        } catch (error) {
            console.error("❌ RabbitMQ Connection Failed:", error.message);
        }

        return this.channel;
    }
}

module.exports = new UserRabbitMQ();
