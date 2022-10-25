import bcrypt from "bcryptjs";
import express from "express";
import User from "../models/user.model.js";

const router = express.Router();

// get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

// create route to register user
router.post("/register", (req, res) => {
    User.init().then(() => {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
                res.status(400).send(err);
            } else {
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: hash,
                });
                newUser.save((err) => {
                    if (err) {
                        res.status(400).send(err);
                    } else {
                        res.status(201).json({
                            message: "User created!",
                        });
                    }
                });
            }
        });
    });
});

// create route to login user
router.post("/login", (req, res) => {
    User.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
            res.status(400).send(err);
        } else {
            if (!user) {
                res.status(404).send("User not found");
            } else {
                bcrypt.compare(
                    req.body.password,
                    user.password,
                    (err, result) => {
                        if (err) {
                            res.status(400).send(err);
                        } else {
                            if (result) {
                                res.status(200).json({
                                    message: "Login successful!",
                                });
                            } else {
                                res.status(401).send("Login failed!");
                            }
                        }
                    }
                );
            }
        }
    });
});

export default router;
