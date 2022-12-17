import express from "express";
import multer from 'multer';
import path from 'path';
import { CreateAction, GetManga, GetMangaList, UploadChapter } from "../controllers/manga.controller.js";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, req.body.manga_id + '_' + req.body.chapter_order + '_' + Date.now() + path.extname(file.originalname)) //Appending extension
    }
})
var upload = multer({ storage: storage }).single('file');

const coverupload = multer({ storage: multer.memoryStorage() }).single('cover');

const router = express.Router();

// get all manga
router.get("/get-list", GetMangaList);

// get manga
router.get("/get-manga", GetManga);

// create manga
router.post("/create-action", coverupload, CreateAction);

// upload chapter
router.post("/upload", upload, UploadChapter);

export default router;
