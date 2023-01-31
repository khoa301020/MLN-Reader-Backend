import express from "express";
import multer from "multer";
import {
  GetAllComments,
  GetAllMangas,
  GetAllNovels,
  GetAllUsers,
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

export default router;
