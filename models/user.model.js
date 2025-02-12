const { Model } = require("objection");

class User extends Model {
    static get tableName() {
        return "users"; // ✅ Must match table name in schema.sql
    }
}

module.exports = User;
