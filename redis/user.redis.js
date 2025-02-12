const Redis = require("ioredis");

const redis = new Redis({
    host: process.env.REDIS_HOST || "redis_cache",
    port: process.env.REDIS_PORT || 6379
});

redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis Connection Error:", err));

module.exports = redis;
