import express from "express";
import { CreateAction, DeleteAction, GetChapter, GetNovel, GetNovelList, UpdateAction } from "../controllers/novel.controller.js";

const router = express.Router();

// get all novels info
router.get("/get-list", GetNovelList);

// get novel sections and chapters
router.get("/get-novel", GetNovel);

// get chapter
router.get("/get-chapter", GetChapter);

// create action
router.post("/create-action", CreateAction);

// update action
router.post("/update-action", UpdateAction);

// delete action
router.post("/delete-action", DeleteAction);

export default router;
