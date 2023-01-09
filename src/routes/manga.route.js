import express from "express";
import multer from "multer";
import {
  AddHistory,
  CreateChapter,
  CreateManga,
  CreateSection,
  DeleteChapter,
  DeleteManga,
  DeleteSection,
  GetChapter,
  GetHistory,
  GetLastUpdate,
  GetManga,
  GetMangaList,
  GetMangaUpdate,
  GetSection,
  RestoreChapter,
  RestoreManga,
  RestoreSection,
  UpdateChapter,
  UpdateManga,
  UpdateSection,
} from "../controllers/manga.controller.js";
import { ValidatePermission } from "../validations/manga.validation.js";

const chapterupload = multer({ storage: multer.memoryStorage() }).single(
  "chapter"
);

const coverupload = multer({ storage: multer.memoryStorage() }).single("cover");

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

// delete manga
router.post("/delete-manga", ValidatePermission, DeleteManga);

// delete section
router.post("/delete-section", ValidatePermission, DeleteSection);

// delete chapter
router.post("/delete-chapter", ValidatePermission, DeleteChapter);

// restore manga
router.post("/restore-manga", ValidatePermission, RestoreManga);

// restore section
router.post("/restore-section", ValidatePermission, RestoreSection);

// restore chapter
router.post("/restore-chapter", ValidatePermission, RestoreChapter);

export default router;
