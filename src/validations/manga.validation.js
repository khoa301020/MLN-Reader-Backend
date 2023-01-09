import jwt from "jsonwebtoken";
import { Chapter, Manga, Section } from "../models/manga.model.js";
import User from "../models/user.model.js";

export const ValidatePermission = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.unauth({ message: "Unauthorized" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.unauth({ message: "Unauthorized" });
  }

  const user = await User.findOne({ id: decoded.id, token: token }).select(
    "id, name"
  );
  if (!user) {
    return res.unauth({ message: "Unauthorized" });
  }

  const type = req.body.type;
  const id = req.body.id;
  let uploader;

  if (type === "manga") {
    const manga = await Manga.findOne({ id }).select("uploader");
    uploader = manga.uploader;
  }

  if (type === "section") {
    const section = await Section.findOne({ id }).select("mangaId");
    const manga = await Manga.findOne({ id: section.mangaId }).select(
      "uploader"
    );
    uploader = manga.uploader;
  }

  if (type === "chapter") {
    const chapter = await Chapter.findOne({ id }).select("mangaId");
    const manga = await Manga.findOne({ id: chapter.mangaId }).select(
      "uploader"
    );
    uploader = manga.uploader;
  }

  if (uploader !== user.name) {
    return res.unauth({ message: "Unauthorized" });
  }

  next();
};
