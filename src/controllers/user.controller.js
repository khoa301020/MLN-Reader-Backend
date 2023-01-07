import jwt from "jsonwebtoken";
import _const from "../constants/const.js";
import * as Helper from "../helper/helper.js";
import { Comment, SystemStatus } from "../models/common.model.js";
import { Manga } from "../models/manga.model.js";
import { Novel } from "../models/novel.model.js";
import User from "../models/user.model.js";

const CommentAction = (req, res) => {
  if (!req.body.targetId)
    return res.error({ message: "Target ID is required" });
  if (!req.body.username)
    return res.unauth({ message: "Username is required" });
  if (!req.body.content) return res.error({ message: "Content is required" });
  if (!req.body.action) return res.error({ message: "Action is required" });
  if (!_const.COMMENT_ACTIONS.includes(req.body.action))
    return res.error({ message: "Invalid action" });

  const { targetId, username, path, type, content, action } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return res.unauth({ message: "Invalid request" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  User.findOne({ id: decoded.id, token: token }).exec(function (err, user) {
    if (err) return res.internal({ message: "Error occured", errors: err });
    if (!user) return res.unauth({ message: "User not found" });
    if (user.name !== username) return res.unauth({ message: "Wrong user" });

    const prefix = "comment_";
    const userId = user.id;

    if (action === "comment") {
      SystemStatus.findOne({}).exec(function (err, SystemStatus) {
        if (err) return res.error(err);
        if (!SystemStatus)
          return res.error({ message: "System status not found" });

        SystemStatus.lastCommentId += 1;

        const newComment = new Comment({
          id: prefix + SystemStatus.lastCommentId,
          targetId,
          userId,
          content,
          path,
          type,
        });

        newComment.save(function (err) {
          if (err) return res.error(err);
          SystemStatus.save(function (err) {
            if (err) return res.error(err);
            return res.created({
              message: "Comment created",
              result: newComment,
            });
          });
        });
      });
    } else if (action === "modify") {
      if (!req.body.commentId)
        return res.error({ message: "Comment ID is required" });
      const { commentId } = req.body;

      Comment.findOne({ id: commentId }).exec(function (err, comment) {
        if (err) return res.error(err);
        if (!comment) return res.error({ message: "Comment not found" });
        if (comment.userId !== userId)
          return res.error({
            message: "You are not the owner of this comment",
          });

        const oldComment = comment.content;
        const oldCommentTimestamp = comment.updatedAt;

        comment.content = content;
        comment.history.push({
          content: oldComment,
          modifiedAt: oldCommentTimestamp,
        });
        comment.updatedAt = Date.now();

        comment.markModified("history");
        comment.markModified("content");
        comment.markModified("updatedAt");

        comment.save(function (err) {
          if (err) return res.error(err);
          return res.success({
            message: "Comment modified",
            result: comment,
          });
        });
      });
    } else if (action === "delete") {
      if (!req.body.commentId)
        return res.error({ message: "Comment ID is required" });
      const { commentId } = req.body;

      Comment.findOne({ id: commentId }).exec(function (err, comment) {
        if (err) return res.error(err);
        if (!comment) return res.error({ message: "Comment not found" });
        if (comment.userId !== userId)
          return res.error({
            message: "You are not the owner of this comment",
          });

        comment.deletedAt = Date.now();
        comment.save(function (err) {
          if (err) return res.error(err);
          return res.success({
            message: "Comment deleted",
            result: comment,
          });
        });
      });
    } else if (action === "restore") {
      if (!req.body.commentId)
        return res.error({ message: "Comment ID is required" });
      const { commentId } = req.body;

      Comment.findOne({ id: commentId }).exec(function (err, comment) {
        if (err) return res.error(err);
        if (!comment) return res.error({ message: "Comment not found" });
        if (comment.userId !== userId)
          return res.error({
            message: "You are not the owner of this comment",
          });

        comment.deletedAt = null;
        comment.save(function (err) {
          if (err) return res.error(err);
          return res.success({
            message: "Comment restored",
            result: comment,
          });
        });
      });
    } else {
      return res.error({ message: "Invalid action" });
    }
  });
};

const GetUser = (req, res) => {
  if (!req.query.id) return res.error({ message: "User ID is required" });

  const { id } = req.query;

  User.findOne({ id })
    .select("-_id id name avatar email role")
    .populate("uploadedNovels")
    .populate("uploadedMangas")
    .populate("uploadedNovelChapters")
    .populate("uploadedMangaChapters")
    .populate({ path: "followingNovels", select: "id -_id" })
    .populate({ path: "followingMangas", select: "id -_id" })
    .exec(function (err, user) {
      if (err) return res.error(err);
      if (!user) return res.error({ message: "User not found" });

      return res.success({ message: "User found", result: user });
    });
};

const GetBothHistory = (req, res) => {
  if (!req.query.username)
    return res.error({ message: "Username is required" });

  const { username } = req.query;

  User.findOne({ name: username }).exec(function (err, user) {
    if (err) return res.error(err);
    if (!user) return res.error({ message: "User not found" });

    const historyBooks = [...user.history.novel, ...user.history.manga];

    historyBooks.sort(
      (a, b) =>
        Helper.datetimeAsInteger(b.lastRead) -
        Helper.datetimeAsInteger(a.lastRead)
    );

    return res.success({
      message: "History found",
      result: historyBooks.slice(0, 10),
    });
  });
};

const GetNewestBooks = async (req, res) => {
  const limit = req.query.limit || null;
  var newestNovels = await Novel.find({})
    .sort({ createdAt: -1 })
    .populate("chapterCount")
    .populate({
      path: "lastChapter",
      select: "id title createdAt",
      options: { sort: { createdAt: -1 }, lean: true },
    })
    .select("id title cover description tags type createdAt");
  var newestMangas = await Manga.find({})
    .sort({ createdAt: -1 })
    .populate("chapterCount")
    .populate({
      path: "lastChapter",
      select: "id title createdAt",
      options: { sort: { createdAt: -1 }, lean: true },
    })
    .select("id title cover description tags type createdAt");

  const newestBooks = [...newestNovels, ...newestMangas];

  newestBooks.sort(
    (a, b) =>
      Helper.datetimeAsInteger(b.createdAt) -
      Helper.datetimeAsInteger(a.createdAt)
  );

  return res.success({
    message: "Latest books found",
    result: limit ? newestBooks.slice(0, limit) : newestBooks,
  });
};

const GetCompletedBooks = async (req, res) => {
  const novels = await Novel.aggregate([
    { $match: { status: "Đã hoàn thành" } },
    { $sample: { size: 8 } },
    { $project: { id: 1, title: 1, cover: 1 } },
    { $addFields: { type: "novel" } },
  ]);

  const mangas = await Manga.aggregate([
    { $match: { status: "Đã hoàn thành" } },
    { $sample: { size: 8 } },
    { $project: { id: 1, title: 1, cover: 1 } },
    { $addFields: { type: "manga" } },
  ]);

  return res.success({
    message: "Completed books found",
    result: { novels, mangas },
  });
};

const GetSelf = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    return res.error({ message: "Invalid token" });
  }

  const userId = decoded.id;

  User.findOne({ id: userId })
    .select("-_id id name avatar email role")
    .populate("uploadedNovels")
    .populate("uploadedMangas")
    .populate("uploadedNovelChapters")
    .populate("uploadedMangaChapters")
    .populate({ path: "followingNovels", select: "id -_id" })
    .populate({ path: "followingMangas", select: "id -_id" })
    .exec(function (err, user) {
      if (err) return res.error(err);
      if (!user) return res.error({ message: "User not found" });

      return res.success({ message: "User found", result: user });
    });
};

const Follow = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const bookId = req.body.bookId;

  if (!bookId) return res.error({ message: "Book ID is required" });
  const type = bookId.includes("novel") ? "novel" : "manga";
  const Book = type === "novel" ? Novel : Manga;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    return res.error({ message: "Invalid token" });
  }

  const userId = decoded.id;
  let message = "";

  User.findOne({ id: userId }).exec(function (err, user) {
    if (err) return res.error(err);

    Book.findOne({ id: bookId }).exec(function (err, book) {
      if (err) return res.error(err);

      if (book.followers?.length > 0 && book.followers?.includes(user._id)) {
        message = "Unfollowed";
        book.followers.pull(user._id);
        type === "novel"
          ? user.followingNovels.pull(book._id)
          : user.followingMangas.pull(book._id);
      } else {
        message = "Followed";
        book.followers.push(user._id);
        type === "novel"
          ? user.followingNovels.push(book._id)
          : user.followingMangas.push(book._id);
      }

      book.save(function (err) {
        if (err) return res.error({ message: err.message, errors: err });
      });
      user.save(function (err) {
        if (err) return res.error({ message: err.message, errors: err });
      });

      const bookFollowers = book.followers.length;

      return res.success({ message, result: { bookFollowers } });
    });
  });
};

const CheckFollow = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const bookId = req.query.bookId;

  if (!bookId) return res.error({ message: "Book ID is required" });
  const type = bookId.includes("novel") ? "novel" : "manga";
  const Book = type === "novel" ? Novel : Manga;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err);
    return res.error({ message: "Invalid token" });
  }

  const userId = decoded.id;

  User.findOne({ id: userId }).exec(function (err, user) {
    if (err) return res.error(err);

    Book.findOne({ id: bookId }).exec(function (err, book) {
      if (err) return res.error(err);

      if (book.followers?.length > 0 && book.followers?.includes(user._id)) {
        return res.success({ message: "Following" });
      } else {
        return res.success({ message: "Not following" });
      }
    });
  });
};

export {
  CommentAction,
  GetUser,
  GetBothHistory,
  GetNewestBooks,
  GetCompletedBooks,
  GetSelf,
  Follow,
  CheckFollow,
};
