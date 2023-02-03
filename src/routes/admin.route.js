import express from "express";
import multer from "multer";
import {
  BanUser,
  DeleteComment,
  DeleteManga,
  DeleteNovel,
  GetAllComments,
  GetAllMangas,
  GetAllNovels,
  GetAllUsers,
  RestoreComment,
  RestoreManga,
  RestoreNovel,
  UnbanUser,
} from "../controllers/admin.controller.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("avatar");

const router = express.Router();

// get all users
router.get("/get-users", GetAllUsers);

// get all novels
router.get("/get-novels", GetAllNovels);

// get all mangas
router.get("/get-mangas", GetAllMangas);

// get all comments
router.get("/get-comments", GetAllComments);

// ban user
router.post("/ban-user/:id", BanUser);

// unban user
router.post("/unban-user/:id", UnbanUser);

// delete novel
router.post("/delete-novel/:id", DeleteNovel);

// restore novel
router.post("/restore-novel/:id", RestoreNovel);

// delete manga
router.post("/delete-manga/:id", DeleteManga);

// restore manga
router.post("/restore-manga/:id", RestoreManga);

// delete comment
router.post("/delete-comment/:id", DeleteComment);

// restore comment
router.post("/restore-comment/:id", RestoreComment);

export default router;
