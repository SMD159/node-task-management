const joi = require("joi");
const log = require("../../logger");
const userService = require("./users.service");

class UserController {
    async createUser(payload = {}) {
        const schema = joi.object().keys({
            name: joi.string().required(),
            email: joi.string().email().required(),
            password: joi.string().min(6).required()
        });

        const isNotValid = schema.validate(payload).error;
        if (isNotValid) {
            return {
                success: false,
                responseCode: 900,
                message: isNotValid.message,
                data: null
            };
        }

        try {
            const data = await userService.createUser(payload);
            return data;
        } catch (error) {
            log.error(error);
            return {
                success: false,
                responseCode: 900,
                message: error.message,
                data: null
            };
        }
    }

    async getUsers(payload = {}) {
        const schema = joi.object({
            id: joi.string().optional().error(new Error("Invalid user ID format"))
        });

        const validationError = schema.validate(payload).error;

        if (validationError) {
            return {
                success: false,
                responseCode: 900,
                message: validationError.message,
                data: null
            };
        }

        try {
            const data = payload.id
                ? await userService.getUsers(payload.id)
                : await userService.getUsers();

            return data;
        } catch (error) {
            log.error(error);
            return {
                success: false,
                responseCode: 900,
                message: error.message,
                data: null
            };
        }
    }

    async updateUser(payload = {}) {
        const schema = joi.object().keys({
            id: joi.string().required(),
            name: joi.string().optional(),
            email: joi.string().email().optional(),
            password: joi.string().min(6).optional()
        });

        const isNotValid = schema.validate(payload).error;
        if (isNotValid) {
            return {
                success: false,
                responseCode: 900,
                message: isNotValid.message,
                data: null
            };
        }

        try {
            const user = await userService.updateUser(payload.id, payload);
            return user;
        } catch (error) {
            log.error(error);
            return {
                success: false,
                responseCode: 900,
                message: error.message,
                data: null
            };
        }
    }

    async deleteUser(payload = {}) {
        const schema = joi.object().keys({
            id: joi.string().required().error(new Error("Invalid user ID format"))
        });

        const isNotValid = schema.validate(payload).error;
        if (isNotValid) {
            return {
                success: false,
                responseCode: 900,
                message: isNotValid.message,
                data: null
            };
        }

        try {
            await userService.deleteUser(payload.id);
            return {
                success: true,
                responseCode: 200,
                message: "User deleted successfully",
                data: null
            };
        } catch (error) {
            log.error(error);
            return {
                success: false,
                responseCode: 900,
                message: error.message,
                data: null
            };
        }
    }
}

module.exports = new UserController();
