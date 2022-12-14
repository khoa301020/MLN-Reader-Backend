import express from "express";
import {
  GetNewestComments,
  GetTags,
  TagAction,
} from "../controllers/admin.controller.js";
import {
  CheckFollow,
  CommentAction,
  Follow,
  GetBothHistory,
  GetCompletedBooks,
  GetNewestBooks,
  GetUser,
} from "../controllers/user.controller.js";

const router = express.Router();

// create route to login user
router.post("/comment-action", CommentAction);

// get all tags
router.get("/get-tags", GetTags);

// create tag action route
router.post("/tag-action", TagAction);

// get newest comments
router.get("/get-newest-comments", GetNewestComments);

// get user
router.get("/get-user", GetUser);

// get history
router.get("/get-history", GetBothHistory);

// get latest
router.get("/get-latest", GetNewestBooks);

// get completed
router.get("/get-completed", GetCompletedBooks);

// follow
router.post("/follow", Follow);

// check follow
router.get("/check-follow", CheckFollow);

export default router;
