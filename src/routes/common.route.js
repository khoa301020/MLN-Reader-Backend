import express from "express";
import { CommentAction } from "../controllers/user.controller.js";

const router = express.Router();

// create route to login user
router.post("/comment-action", CommentAction);

export default router;
