import jwt from "jsonwebtoken";
import { SystemStatus } from "../models/common.model.js";
import User from "../models/user.model.js";

// Get all
const GetAll = async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
}

// Register
const Register = (req, res) => {
    SystemStatus.findOne({}).exec(function (err, systemStatus) {
        if (err) return res.error({ message: "Error occured", errors: err });
        if (!systemStatus) return res.error({ message: "System status not found" });

        systemStatus.lastUserId += 1;

        const prefix = "user_";

        User.findOne({
            $or: [
                { email: req.body.email },
                { name: req.body.name }
            ]
        }, (err, user) => {
            if (err) return res.error({ message: "Error occured", errors: err });
            if (user) return res.error({ message: "Username or email already exists", errors: err });

            const newUser = new User({
                id: prefix + systemStatus.lastUserId,
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
            });

            newUser.save((err) => {
                if (err) {
                    return res.error({ message: "Error occured", errors: err });
                } else {
                    systemStatus.save(function (err) {
                        if (err) return res.error({ message: "Error occured", errors: err });
                        return res.success({
                            message: "User created!",
                        });
                    });
                }

            });

        });

    });
}

// Login
const Login = (req, res) => {
    User.findOne({
        $or: [
            { email: req.body.query },
            { name: req.body.query }
        ]
    }, async (err, user) => {
        if (err) return res.error({ message: "Error occured", errors: err });
        if (!user) return res.unauth({ message: "User not found" });

        const checkValidPassword = await user.isValidPassword(req.body.password);
        if (!checkValidPassword) return res.unauth({ message: "Invalid password" });

        const token = await user.generateToken();

        res.cookie("token", token, {
            httpOnly: false,
            withCredentials: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
            sameSite: "none",
            secure: true,
        });

        return res.success({
            message: "User logged in",
            result: {
                token,
                username: user.name,
                role: user.role,
            }
        });
    });
}

const Verify = (req, res) => {
    const username = req.body.username;
    const token = req.headers.authorization.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        User.findOne({ id: decoded.id, token: token }, (err, user) => {
            if (err) return res.internal({ message: "Error occured", errors: err });
            if (!user) return res.unauth({ message: "User not found" });
            if (user.name !== username) return res.unauth({ message: "Wrong user" });

            res.success({
                message: "User verified",
                result: {
                    username: user.name,
                    role: user.role,
                }
            });
        });
    } catch (error) {
        return res.unauth({ message: "Invalid token" });
    }
}

const Logout = (req, res) => {
    const username = req.body.username;

    User.findOne({ name: username }, (err, user) => {
        if (err) return res.internal({ message: "Error occured", errors: err });
        if (!user) return res.unauth({ message: "User not found" });

        user.token = null;
        user.save((err) => {
            if (err) return res.internal({ message: "Error occured", errors: err });

            res.success({
                message: "User logged out",
            });
        });
    });
}


// Export
export { GetAll, Register, Login, Verify, Logout };

