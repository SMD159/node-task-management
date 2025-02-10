const amqp = require("amqplib");

let channel = null;

async function connectRabbitMQ() {
    if (!process.env.RABBITMQ_HOST) {
        console.log("🚀 Skipping RabbitMQ connection (not configured).");
        return null;
    }

    try {
        const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq";
        const connection = await amqp.connect(`amqp://${rabbitmqHost}`);
        channel = await connection.createChannel();
        await channel.assertQueue("user_created");
        await channel.assertQueue("user_deleted");
        console.log("✅ Connected to RabbitMQ");
    } catch (error) {
        console.error("❌ RabbitMQ Connection Failed:", error.message);
    }

    return channel;
}

module.exports = connectRabbitMQ;
