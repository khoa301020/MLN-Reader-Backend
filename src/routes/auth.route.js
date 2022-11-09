import express from "express";
import { GetAll, Login, Register } from "../controllers/user.controller.js";

const router = express.Router();

// get all users
router.get("/", GetAll);

// create route to register user
router.post("/register", Register);

// create route to login user
router.post("/login", Login);

export default router;
