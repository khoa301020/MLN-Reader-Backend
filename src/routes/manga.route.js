import express from "express";
import multer from 'multer';
import path from 'path';
import { GetAll, Unzip, Upload } from "../controllers/manga.controller.js";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})

var upload = multer({ storage: storage });

const router = express.Router();

// get all users
router.get("/", GetAll);

// upload manga
router.put("/upload", Upload);

// unzip
router.post("/unzip", upload.single('file'), Unzip);

export default router;
