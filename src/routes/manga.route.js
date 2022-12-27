import express from "express";
import multer from 'multer';
import {
    AddHistory, CreateChapter, CreateManga,
    CreateSection, GetChapter, GetHistory, GetLastUpdate, GetManga, GetMangaList, GetMangaUpdate,
    GetSection, UpdateChapter, UpdateManga, UpdateSection
} from "../controllers/manga.controller.js";

const chapterupload = multer({ storage: multer.memoryStorage() }).single('chapter');

const coverupload = multer({ storage: multer.memoryStorage() }).single('cover');

const router = express.Router();

// get all manga
router.get("/get-list", GetMangaList);

// get manga
router.get("/get-manga", GetManga);

// get manga update
router.get("/get-manga-update", GetMangaUpdate);

// get section
router.get("/get-section", GetSection);

// get chapter
router.get("/get-chapter", GetChapter);

// create manga
router.post("/create-manga", coverupload, CreateManga);

// create section
router.post("/create-section", coverupload, CreateSection);

// upload chapter
router.post("/create-chapter", chapterupload, CreateChapter);

// update manga
router.post("/update-manga", coverupload, UpdateManga);

// update section
router.post("/update-section", coverupload, UpdateSection);

// update chapter
router.post("/update-chapter", chapterupload, UpdateChapter);

// add history
router.post("/add-history", AddHistory);

// get history
router.get("/get-history", GetHistory);

// get last update
router.get("/get-last-update", GetLastUpdate);

export default router;
