const userService = require("./users.service");

exports.createUser = async (req, res) => {
    try {
        console.log("Create User Request Body:", req.body);
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(400).json({ error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        console.log("Fetching user with ID:", req.params.id);

        // ✅ Ensure valid UUID or numeric ID format
        if (!/^\d+$/.test(req.params.id)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const user = await userService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        console.log("Update User Request Body:", req.body);
        const user = await userService.updateUser(req.params.id, req.body);
        res.json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(400).json({ error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        console.log("Deleting user with ID:", req.params.id);
        await userService.deleteUser(req.params.id);
        res.json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: error.message });
    }
};
