import express from "express";
import multer from "multer";

import { AddHistory, CreateAction, DeleteAction, FollowAction, GetChapter, GetHistory, GetNovel, GetNovelList, UpdateAction } from "../controllers/novel.controller.js";

const upload = multer({ storage: multer.memoryStorage() }).single('cover');


const router = express.Router();

// get all novels info
router.get("/get-list", GetNovelList);

// get novel sections and chapters
router.get("/get-novel", GetNovel);

// get chapter
router.get("/get-chapter", GetChapter);

// create action
router.post("/create-action", upload, CreateAction);

// update action
router.post("/update-action", UpdateAction);

// delete action
router.post("/delete-action", DeleteAction);

// follow action
router.post("/follow-action", FollowAction);

// add history
router.post("/add-history", AddHistory);

// get history
router.get("/get-history", GetHistory);

export default router;
