import express from "express";
import { BookVerify, GetAll, Login, Logout, Register, Verify } from "../controllers/auth.controller.js";

const router = express.Router();

// get all users
router.get("/", GetAll);

// create route to register user
router.post("/register", Register);

// create route to login user
router.post("/login", Login);

// create route to verify user
router.post("/verify", Verify);

// create route to verify book
router.post("/book-verify", BookVerify);

// create route to logout user
router.post("/logout", Logout);

// get current user
router.get("/me",);

export default router;
