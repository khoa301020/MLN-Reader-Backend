import express from "express";
import multer from "multer";

import {
    AddHistory, CreateAction, DeleteAction,
    FollowAction, GetChapter, GetHistory, GetLastUpdate, GetNovel, GetNovelList, GetNovelUpdate,
    GetSection, UpdateAction
} from "../controllers/novel.controller.js";

const upload = multer({ storage: multer.memoryStorage() }).single('cover');


const router = express.Router();

// get all novels info
router.get("/get-list", GetNovelList);

// get novel sections and chapters
router.get("/get-novel", GetNovel);

// get novel update
router.get("/get-novel-update", GetNovelUpdate);

// get section
router.get("/get-section", GetSection);

// get chapter
router.get("/get-chapter", GetChapter);

// create action
router.post("/create-action", upload, CreateAction);

// update action
router.post("/update-action", upload, UpdateAction);

// delete action
router.post("/delete-action", DeleteAction);

// follow action
router.post("/follow-action", FollowAction);

// add history
router.post("/add-history", AddHistory);

// get history
router.get("/get-history", GetHistory);

// get last update
router.get("/get-last-update", GetLastUpdate);

export default router;
