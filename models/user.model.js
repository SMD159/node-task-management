const { Model } = require("objection");
const knex = require("../knex/index.js");

Model.knex(knex); // ✅ Bind Knex instance

class User extends Model {
    static get tableName() {
        return "users";
    }
}

module.exports = User;
