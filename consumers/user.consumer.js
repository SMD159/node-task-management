const fs = require("fs");
const path = require("path");
const rabbitMQ = require("../rabbitmq/user.rabbitmq"); // ✅ Import as an object

class UserLogger {
    async consumeMessages() {
        try {
            const channel = await rabbitMQ.connect(); // ✅ Call the `.connect()` method
            if (!channel) {
                console.error("🚨 Failed to connect to RabbitMQ. Retrying in 5 seconds...");
                setTimeout(() => this.consumeMessages(), 5000);
                return;
            }

            channel.prefetch(1);
            console.log("📂 Logging Consumer Running...");

            channel.consume("user_created", (msg) => {
                const user = JSON.parse(msg.content.toString());
                console.log("📝 Logging user creation:", user);
                this.logToFile(`User Created: ${JSON.stringify(user)}`);
                channel.ack(msg);
            });

            channel.consume("user_deleted", (msg) => {
                const { id } = JSON.parse(msg.content.toString());
                console.log("📝 Logging user deletion:", id);
                this.logToFile(`User Deleted: ${id}`);
                channel.ack(msg);
            });
        } catch (error) {
            console.error("🚨 RabbitMQ Logging Consumer Error:", error);
            setTimeout(() => this.consumeMessages(), 5000); // Retry after 5 seconds
        }
    }

    logToFile(message) {
        const logFilePath = path.join(__dirname, "../logs/user_activity.log");
        fs.appendFile(logFilePath, `${new Date().toISOString()} - ${message}\n`, (err) => {
            if (err) console.error("❌ Error writing to log file:", err);
        });
    }
}

const userLogger = new UserLogger();
userLogger.consumeMessages();

module.exports = userLogger;
