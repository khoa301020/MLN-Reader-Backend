import { Comment, Tag } from "../models/common.model.js";
import { Manga } from "../models/manga.model.js";
import { Novel } from "../models/novel.model.js";
import User from "../models/user.model.js";

export const GetAllUsers = async (req, res) => {
  const manager = res.locals.user;
  try {
    const users = await User.find({ id: { $ne: manager.id }, role: "user" })
      .select("id avatar name email accountStatus createdAt")
      .populate("uploadedNovels")
      .populate("uploadedMangas")
      .lean();
    res.success({ message: "Users found", result: users });
  } catch (err) {
    res.error({ message: "Error occurred", errors: err });
  }
};

export const GetAllNovels = async (req, res) => {
  try {
    const users = await Novel.find({})
      .select("id cover title author tags status uploader deletedAt")
      .populate("sectionCount")
      .populate("chapterCount")
      .lean();
    res.success({ message: "Users found", result: users });
  } catch (err) {
    res.error({ message: "Error occurred", errors: err });
  }
};

export const GetAllMangas = async (req, res) => {
  try {
    const users = await Manga.find({})
      .select("id cover title author tags status uploader deletedAt")
      .populate("sectionCount")
      .populate("chapterCount")
      .lean();
    res.success({ message: "Users found", result: users });
  } catch (err) {
    res.error({ message: "Error occurred", errors: err });
  }
};

export const GetAllComments = async (req, res) => {
  try {
    const users = await Comment.find({})
      .select("id targetId type userId content createdAt deletedAt")
      .populate("user", "id name")
      .populate("target", "id title cover")
      .lean();
    res.success({ message: "Users found", result: users });
  } catch (err) {
    res.error({ message: "Error occurred", errors: err });
  }
};

export const GetTags = async (req, res) => {
  try {
    const tags = await Tag.find({}, { _id: 0, createdAt: 0, __v: 0 });
    res.success({ message: "Get all tags", result: tags });
  } catch (error) {
    res.error({ message: "Error occured", errors: error });
  }
};

export const TagAction = async (req, res) => {
  if (!req.body.action) return res.error({ message: "Action is required" });
  if (req.body.action === "create") {
    if (!req.body.name) return res.error({ message: "Name is required" });
    if (!req.body.code) return res.error({ message: "Code is required" });

    try {
      const tag = await Tag.create({
        name: req.body.name,
        code: req.body.code,
      });
      res.success({ message: "Create tag", result: tag });
    } catch (error) {
      res.error({ message: "Error occured", errors: error });
    }
  } else if (req.body.action === "update") {
    if (!req.body.name) return res.error({ message: "Name is required" });
    if (!req.body.code) return res.error({ message: "Code is required" });

    try {
      const tag = await Tag.findByIdAndUpdate(
        req.body.code,
        { name: req.body.name, code: req.body.code },
        { new: true }
      );
      res.success({ message: "Update tag", result: tag });
    } catch (error) {
      res.error({ message: "Error occured", errors: error });
    }
  } else if (req.body.action === "delete") {
    if (!req.body.code) return res.error({ message: "Code is required" });

    try {
      const tag = Tag.findOneAndDelete({ code: req.body.code });
      res.success({ message: "Delete tag", result: tag });
    } catch (error) {
      res.error({ message: "Error occured", errors: error });
    }
  } else {
    return res.error({ message: "Action is invalid" });
  }
};

export const GetNewestComments = (req, res) => {
  try {
    Comment.find({
      $or: [{ type: "manga" }, { type: "novel" }],
      deletedAt: null,
    })
      .select("path targetId type userId content createdAt")
      .populate("user", "name avatar")
      .populate("target", "title")
      .sort({ createdAt: -1 })
      .limit(10)
      .exec(async (err, comments) => {
        if (err) return res.error({ message: "Error occured", errors: err });

        res.success({ message: "Get newest comments", result: comments });
      });
  } catch (error) {
    console.log(error);
    res.error({ message: "Error occured", errors: error });
  }
};

export const BanUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOneAndUpdate(
      { id },
      {
        "accountStatus.status": "disabled",
      },
      { new: true }
    )
      .select("id avatar name email accountStatus createdAt")
      .populate("uploadedNovels")
      .populate("uploadedMangas");
    res.success({ message: "User banned successfully", result: user });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};

export const UnbanUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findOneAndUpdate(
      { id },
      {
        "accountStatus.status": "active",
      },
      { new: true }
    )
      .select("id avatar name email accountStatus createdAt")
      .populate("uploadedNovels")
      .populate("uploadedMangas");
    res.success({ message: "User unbanned successfully", result: user });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};

export const DeleteNovel = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Novel.findOneAndUpdate(
      { id },
      {
        deletedAt: Date.now(),
      },
      { new: true }
    )
      .select("id cover title author tags status uploader deletedAt")
      .populate("sectionCount")
      .populate("chapterCount");
    res.success({ message: "Book deleted successfully", result: book });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};

export const RestoreNovel = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Novel.findOneAndUpdate(
      { id },
      {
        deletedAt: null,
      },
      { new: true }
    )
      .select("id cover title author tags status uploader deletedAt")
      .populate("sectionCount")
      .populate("chapterCount");
    res.success({ message: "Book restored successfully", result: book });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};

export const DeleteManga = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Manga.findOneAndUpdate(
      { id },
      {
        deletedAt: Date.now(),
      },
      { new: true }
    )
      .select("id cover title author tags status uploader deletedAt")
      .populate("sectionCount")
      .populate("chapterCount");
    res.success({ message: "Book deleted successfully", result: book });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};

export const RestoreManga = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Manga.findOneAndUpdate(
      { id },
      {
        deletedAt: null,
      },
      { new: true }
    )
      .select("id cover title author tags status uploader deletedAt")
      .populate("sectionCount")
      .populate("chapterCount");
    res.success({ message: "Book restored successfully", result: book });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};

export const DeleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await Comment.findOneAndUpdate(
      { id },
      {
        deletedAt: Date.now(),
      },
      { new: true }
    )
      .select("id targetId type userId content createdAt deletedAt")
      .populate("user", "id name")
      .populate("target", "id title cover");
    res.success({ message: "Comment deleted successfully", result: comment });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};

export const RestoreComment = async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await Comment.findOneAndUpdate(
      { id },
      {
        deletedAt: null,
      },
      { new: true }
    )
      .select("id targetId type userId content createdAt deletedAt")
      .populate("user", "id name")
      .populate("target", "id title cover");
    res.success({ message: "Comment restored successfully", result: comment });
  } catch (err) {
    console.log(err);
    res.error({ message: "Error occurred", errors: err });
  }
};
