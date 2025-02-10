const { Model } = require("objection");
const knex = require("../knes.js/index.js");

Model.knex(knex); // ✅ Bind Knex instance

class User extends Model {
    static get tableName() {
        return "users";
    }
}

module.exports = User;
