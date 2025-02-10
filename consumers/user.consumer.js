const connectRabbitMQ = require("../rabbitmq/user.rabbitmq");

async function consumeMessages() {
    try {
        const channel = await connectRabbitMQ();

        // Set prefetch to 1 (process one message at a time)
        channel.prefetch(1);

        console.log("✅ RabbitMQ Consumers Running...");

        channel.consume("user_created", (msg) => {
            try {
                const user = JSON.parse(msg.content.toString());
                console.log("📩 New User Created:", user);

                // Process user creation logic (e.g., send email)
                // await sendWelcomeEmail(user); // Example function

                channel.ack(msg);
            } catch (error) {
                console.error("🚨 Error processing user_created message:", error);
            }
        });

        channel.consume("user_deleted", (msg) => {
            try {
                const { id } = JSON.parse(msg.content.toString());
                console.log("❌ User Deleted:", id);

                // Process user deletion logic (e.g., remove from cache)
                // await removeUserData(id); // Example function

                channel.ack(msg);
            } catch (error) {
                console.error("🚨 Error processing user_deleted message:", error);
            }
        });
    } catch (error) {
        console.error("🚨 RabbitMQ Connection Error:", error);
        setTimeout(consumeMessages, 5000); // Retry after 5 seconds if connection fails
    }
}

// Start consumer
consumeMessages();
