import express from "express";
import multer from 'multer';
import { AddHistory, CreateChapter, CreateManga, CreateSection, GetChapter, GetHistory, GetManga, GetMangaList } from "../controllers/manga.controller.js";

const chapterupload = multer({ storage: multer.memoryStorage() }).single('chapter');

const coverupload = multer({ storage: multer.memoryStorage() }).single('cover');

const router = express.Router();

// get all manga
router.get("/get-list", GetMangaList);

// get manga
router.get("/get-manga", GetManga);

// get chapter
router.get("/get-chapter", GetChapter);

// create manga
router.post("/create-manga", coverupload, CreateManga);

// create section
router.post("/create-section", coverupload, CreateSection);

// upload chapter
router.post("/create-chapter", chapterupload, CreateChapter);

// add history
router.post("/add-history", AddHistory);

// get history
router.get("/get-history", GetHistory);

export default router;
