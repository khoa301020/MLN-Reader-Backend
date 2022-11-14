import express from "express";
import multer from 'multer';
import path from 'path';
import { CreateManga, GetAll, GetManga, UploadChapter } from "../controllers/manga.controller.js";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        console.log(file);
        cb(null, req.body.manga_id + '_' + req.body.chapter_order + '_' + Date.now() + path.extname(file.originalname)) //Appending extension
    }
})

var upload = multer({ storage: storage }).single('file');

const router = express.Router();

// get all manga
router.get("/", GetAll);

// get manga
router.get("/get", GetManga);

// create manga
router.post("/create", CreateManga);

// upload chapter
router.post("/upload", upload, UploadChapter);

export default router;
