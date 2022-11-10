import express from "express";
import multer from 'multer';
import path from 'path';
import { CreateManga, GetAll, UploadChapter } from "../controllers/manga.controller.js";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, req.body.manga_id + '_' + req.body.chapter + '_' + Date.now() + path.extname(file.originalname)) //Appending extension
    }
})

var upload = multer({ storage: storage });

const router = express.Router();

// get all users
router.get("/", GetAll);

// create manga
router.post("/create", CreateManga);

// upload chapter
router.post("/upload", upload.single('file'), UploadChapter);

export default router;
