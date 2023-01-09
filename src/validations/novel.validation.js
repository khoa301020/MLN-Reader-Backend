import jwt from "jsonwebtoken";
import { Chapter, Note, Novel, Section } from "../models/novel.model.js";
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

  const subject = req.body.subject;
  const id = req.body.id;
  let uploader;

  if (subject === "novel") {
    const novel = await Novel.findOne({ id }).select("uploader");
    uploader = novel.uploader;
  }

  if (subject === "section") {
    const section = await Section.findOne({ id }).select("novelId");
    const novel = await Novel.findOne({ id: section.novelId }).select(
      "uploader"
    );
    uploader = novel.uploader;
  }

  if (subject === "chapter") {
    const chapter = await Chapter.findOne({ id }).select("novelId");
    const novel = await Novel.findOne({ id: chapter.novelId }).select(
      "uploader"
    );
    uploader = novel.uploader;
  }

  if (subject === "note") {
    const note = await Note.findOne({ id }).select("chapterId");
    const chapter = await Chapter.findOne({ id: note.chapterId }).select(
      "novelId"
    );
    const novel = await Novel.findOne({ id: chapter.novelId }).select(
      "uploader"
    );
    uploader = novel.uploader;
  }

  if (uploader !== user.name) {
    return res.unauth({ message: "Unauthorized" });
  }

  next();
};
