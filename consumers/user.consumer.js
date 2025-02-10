const connectRabbitMQ = require("../rabbitmq/user.rabbitmq");

class UserConsumer {
    async consumeMessages() {
        try {
            this.channel = await connectRabbitMQ();
            this.channel.prefetch(1);

            console.log("✅ RabbitMQ Consumers Running...");

            this.channel.consume("user_created", (msg) => {
                try {
                    const user = JSON.parse(msg.content.toString());
                    console.log("📩 New User Created:", user);

                    // Process user creation logic (e.g., send email)
                    // await sendWelcomeEmail(user);

                    this.channel.ack(msg);
                } catch (error) {
                    console.error("🚨 Error processing user_created message:", error);
                }
            });

            this.channel.consume("user_deleted", (msg) => {
                try {
                    const { id } = JSON.parse(msg.content.toString());
                    console.log("❌ User Deleted:", id);

                    // Process user deletion logic (e.g., remove from cache)
                    // await removeUserData(id);

                    this.channel.ack(msg);
                } catch (error) {
                    console.error("🚨 Error processing user_deleted message:", error);
                }
            });
        } catch (error) {
            console.error("🚨 RabbitMQ Connection Error:", error);
            setTimeout(() => this.consumeMessages(), 5000);
        }
    }
}

const rabbitMQConsumer = new UserConsumer();
rabbitMQConsumer.consumeMessages();

module.exports = rabbitMQConsumer;
