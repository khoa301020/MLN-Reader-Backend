import express from "express";
import { GetTags, TagAction } from "../controllers/admin.controller.js";
import { CommentAction } from "../controllers/user.controller.js";

const router = express.Router();

// create route to login user
router.post("/comment-action", CommentAction);

// get all tags
router.get("/get-tags", GetTags);

// create tag action route
router.post("/tag-action", TagAction);

export default router;
