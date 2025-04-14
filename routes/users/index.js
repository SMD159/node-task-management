const express = require("express");
const router = express.Router();
const userController = require("./users.controller");

router.post("/", async function (req, res, next) {
    /*
        #swagger.tags = ['Users']
        #swagger.requestBody = {
            required: true,
            content: { "application/json": { schema: { $ref: "#/definitions/createUserRequest" } } }
        }
        #swagger.responses[200] = {
            content: { "application/json": { schema: { $ref: '#/definitions/responseObject' } } }
        }
    */
    const result = await userController.createUser(req.body);
    res.send(result);
});

router.get("/", async function (req, res, next) {
    /*
        #swagger.tags = ['Users']
        #swagger.responses[200] = {
            content: { "application/json": { schema: { $ref: '#/definitions/userListResponse' } } }
        }
    */
    const result = await userController.getAllUsers();
    res.send(result);
});

router.get("/:id", async function (req, res, next) {
    /*
        #swagger.tags = ['Users']
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'User ID',
            required: true,
            schema: { type: 'string' }
        }
        #swagger.responses[200] = {
            content: { "application/json": { schema: { $ref: '#/definitions/userResponse' } } }
        }
    */
    const result = await userController.getUserById(req.params.id);
    res.send(result);
});

router.put("/:id", async function (req, res, next) {
    /*
        #swagger.tags = ['Users']
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'User ID',
            required: true,
            schema: { type: 'string' }
        }
        #swagger.requestBody = {
            required: true,
            content: { "application/json": { schema: { $ref: "#/definitions/updateUserRequest" } } }
        }
        #swagger.responses[200] = {
            content: { "application/json": { schema: { $ref: '#/definitions/responseObject' } } }
        }
    */
    const result = await userController.updateUser(req.params.id, req.body);
    res.send(result);
});

router.delete("/:id", async function (req, res, next) {
    /*
        #swagger.tags = ['Users']
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'User ID',
            required: true,
            schema: { type: 'string' }
        }
        #swagger.responses[200] = {
            content: { "application/json": { schema: { $ref: '#/definitions/responseObject' } } }
        }
    */
    const result = await userController.deleteUser(req.params.id);
    res.send(result);
});

module.exports = router;
