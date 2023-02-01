import jwt from "jsonwebtoken";
import JSZip from "jszip";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import _const from "../constants/const.js";
import * as Helper from "../helper/helper.js";
import bucket from "../libs/GCP-Storage.js";
import { SystemStatus, Tag } from "../models/common.model.js";
import { Chapter, Manga, Section } from "../models/manga.model.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GetMangaList = async (req, res) => {
  const page = req.query.page;
  const limit = req.query.limit;
  const sort = req.query.sort;

  const select = "id title cover description rating followers statistics";

  Manga.find({})
    .select(select)
    .sort(_const.QUERY_SORT[sort])
    .skip((page - 1) * limit)
    .limit(limit)
    .exec((err, mangas) => {
      if (err)
        return res.error({
          message: "Get manga list failed",
          errors: err,
        });
      res.success({
        message: "Get manga list successfully",
        result: mangas,
      });
    });
};

const GetLastUpdate = async (req, res) => {
  const limit = req.query.limit || 0;
  const select = "id title cover description tags createdAt";

  Manga.find({})
    .populate({
      path: "lastChapter",
      select: "id title createdAt",
      options: { lean: true },
    })
    .select(select)
    .exec(async (err, mangas) => {
      if (err)
        return res.error({
          message: "Get last update failed",
          errors: err,
        });

      mangas.sort(
        (a, b) =>
          Helper.datetimeAsInteger(
            b.lastChapter ? b.lastChapter.createdAt : b.createdAt
          ) -
          Helper.datetimeAsInteger(
            a.lastChapter ? a.lastChapter.createdAt : a.createdAt
          )
      );

      const tags = await Tag.find({
        $or: [{ type: "manga" }, { type: "both" }],
      }).select("-_id code name");

      res.success({
        message: "Get last update successfully",
        result: {
          mangas: limit ? mangas.slice(0, limit) : mangas,
          tags,
        },
      });
    });
};

const GetChapter = (req, res) => {
  if (!req.query.chapterId)
    return res.error({ message: "Chapter id is required" });

  Chapter.findOne({ id: req.query.chapterId, deletedAt: null })
    .populate("mangaInfo", "-_id id title cover")
    .populate("sectionInfo", "-_id id name cover")
    .populate({
      path: "comments",
      select: "-_id id userId content createdAt",
      populate: { path: "user", select: "-_id id name avatar" },
    })
    .exec(async (err, chapter) => {
      if (err)
        return res.error({
          message: "Get chapter failed",
          errors: err,
        });
      if (!chapter) return res.error({ message: "Chapter not found" });

      const sectionTitle = Section.findOne({ id: chapter.sectionId })
        .select("name")
        .exec((err, section) => {
          return section.name;
        });

      if (req.query.isOnly === "true") {
        chapter = {
          id: chapter.id,
          title: chapter.title,
          pages: chapter.pages,
        };

        res.success({
          message: "Get chapter successfully",
          result: chapter,
        });
      } else {
        //increment viewCount
        Chapter.updateOne({ id: chapter.id }, { $inc: { viewCount: 1 } }).exec(
          (err, chapterSave) => {
            if (err) console.log(err);
            if (err)
              return res.error({
                message: "Get chapter failed",
                errors: err,
              });
          }
        );

        const nav = await chapter.setPrevNext(chapter.id, chapter.mangaId);

        Manga.findOne({ id: chapter.mangaId }).exec((err, manga) => {
          if (err) console.log(err);

          const current = Helper.getCurrent();

          if (manga) {
            manga.statistics.totalView += 1;
            manga.statistics.dailyView[`${current.currentDate}`]
              ? (manga.statistics.dailyView[`${current.currentDate}`] += 1)
              : (manga.statistics.dailyView[`${current.currentDate}`] = 1);
            manga.statistics.monthlyView[`${current.currentMonth}`]
              ? (manga.statistics.monthlyView[`${current.currentMonth}`] += 1)
              : (manga.statistics.monthlyView[`${current.currentMonth}`] = 1);
            manga.statistics.yearlyView[`${current.currentYear}`]
              ? (manga.statistics.yearlyView[`${current.currentYear}`] += 1)
              : (manga.statistics.yearlyView[`${current.currentYear}`] = 1);
          }

          manga.markModified("statistics");

          manga.save((err, mangaSave) => {
            if (err) console.log(err);
          });

          res.success({
            message: "Get chapter successfully",
            result: {
              ...chapter._doc,
              ...chapter.$$populatedVirtuals,
              nav,
            },
          });
        });
      }
    });
};

const GetManga = (req, res) => {
  if (!req.query.mangaId) return res.error({ message: "Manga id is required" });

  let find;
  if (req.query.isOnly === "true") {
    find = Manga.findOne({ id: req.query.mangaId, deletedAt: null }).select(
      "id title otherNames author artist status tags cover description"
    );
  } else {
    find = Manga.findOne({ id: req.query.mangaId, deletedAt: null })
      .populate("uploaderInfo", "-_id id name avatar")
      .populate({
        path: "comments",
        select: "-_id id userId content createdAt",
        populate: { path: "user", select: "-_id id name avatar" },
      })
      .populate({
        path: "sections",
        populate: {
          path: "chapters",
          select: "-content -notes",
        },
      });
  }

  find.exec((err, manga) => {
    if (err) return res.error({ message: "Get manga failed", errors: err });
    if (!manga) return res.error({ message: "Manga not found" });

    res.success({ message: "Get manga successfully", result: manga });
  });
};

const GetMangaUpdate = (req, res) => {
  if (!req.query.mangaId) return res.error({ message: "Manga id is required" });
  Manga.findOne({ id: req.query.mangaId, deletedAt: null })
    .select("id title")
    .populate({
      path: "sections",
      select: "id name",
      populate: { path: "chapters", select: "id title" },
    })
    .exec((err, manga) => {
      if (err) return res.error({ message: "Get manga failed", errors: err });
      if (!manga) return res.error({ message: "Manga not found" });

      let mangaUpdate = {
        id: manga.id,
        title: manga.title,
        type: "manga",
        key: "0-0",
        children: [],
      };

      manga.sections.forEach((section, sectionIndex) => {
        let sectionUpdate = {
          id: section.id,
          title: section.name,
          type: "manga-section",
          key: `0-0-${sectionIndex}`,
          children: [],
        };

        section.chapters.forEach((chapter, chapterIndex) => {
          let chapterUpdate = {
            id: chapter.id,
            type: "manga-chapter",
            title: chapter.title,
            key: `0-0-${sectionIndex}-${chapterIndex}`,
          };

          sectionUpdate.children.push(chapterUpdate);
        });

        mangaUpdate.children.push(sectionUpdate);
      });

      res.success({
        message: "Get manga successfully",
        result: mangaUpdate,
      });
    });
};

const GetSection = (req, res) => {
  if (!req.query.sectionId)
    return res.error({ message: "Section id is required" });

  Section.findOne({ id: req.query.sectionId }).exec((err, section) => {
    if (err) return res.error({ message: "Get section failed", errors: err });
    if (!section) return res.error({ message: "Section not found" });

    res.success({ message: "Get section successfully", result: section });
  });
};

const CreateManga = (req, res) => {
  SystemStatus.findOne({}).exec(function (err, SystemStatus) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!SystemStatus) return res.error({ message: "System status not found" });

    SystemStatus.lastMangaId += 1;

    let manga = new Manga({
      id: "manga_" + SystemStatus.lastMangaId,
      title: req.body.title,
      author: req.body.author,
      artist: req.body.artist,
      status: req.body.status,
      otherNames: req.body.otherNames ? JSON.parse(req.body.otherNames) : [],
      description: req.body.description,
      uploader: req.body.uploader,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    });

    if (req.file) {
      const filePath = `manga/${manga.id}/cover${path.extname(
        req.file.originalname
      )}`;
      bucket.file(filePath).save(
        req.file.buffer,
        {
          metadata: {
            contentType: req.file.mimetype,
            cacheControl: "private",
          },
        },
        (err) => {
          if (err) return console.log(err);
        }
      );
      manga.cover = process.env.GCP_STORAGE_URL + filePath;
    } else {
      manga.cover = process.env.HAKO_DEFAULT_COVER;
    }

    manga.save((err) => {
      if (err)
        return res.error({
          message: `Create manga failed`,
          errors: err,
        });
      SystemStatus.save((err) => {
        if (err) return res(err);
        res.created({
          message: `Manga ${manga.id} created!`,
          result: manga,
        });
      });
    });
  });
};

const CreateSection = (req, res) => {
  SystemStatus.findOne({}).exec(function (err, SystemStatus) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!SystemStatus) return res.error({ message: "System status not found" });
    Manga.findOne({ id: req.body.mangaId })
      .populate("sections", "id")
      .exec(function (err, manga) {
        if (err)
          return res.internal({
            message: "Error occurred",
            errors: err,
          });
        if (!manga) return res.error({ message: `Manga not found` });

        SystemStatus.lastMangaSectionId += 1;

        let section = new Section({
          id: "volume_m" + SystemStatus.lastMangaSectionId,
          mangaId: req.body.mangaId,
          name: req.body.name,
        });

        if (req.file) {
          const filePath = `manga/${manga.id}/${section.id}_cover${path.extname(
            req.file.originalname
          )}`;

          bucket.file(filePath).save(
            req.file.buffer,
            {
              metadata: {
                contentType: req.file.mimetype,
                cacheControl: "private",
              },
            },
            (err) => {
              if (err) return console.log(err);
            }
          );
          section.cover = process.env.GCP_STORAGE_URL + filePath;
        } else {
          section.cover = process.env.HAKO_DEFAULT_COVER;
        }

        if (!manga.sections)
          return res.internal({
            message: `Manga sections not found`,
          });
        manga.sections.push(section._id);

        manga.markModified("sections");

        section.save((err) => {
          if (err)
            return res.error({
              message: `Create section failed`,
              errors: err,
            });
          manga.save((err) => {
            if (err)
              return res.error({
                message: `Add section to manga failed`,
                errors: err,
              });
            SystemStatus.save((err) => {
              if (err)
                return res.error({
                  message: "Update manga status failed",
                  errors: err,
                });
              res.created({
                message: `Section ${section.id} created!`,
                result: section,
              });
            });
          });
        });
      });
  });
};

const CreateChapter = (req, res) => {
  if (path.extname(req.file?.originalname) !== ".zip") {
    return res.status(400).json({ error: "File must be a zip file" });
  }

  const token = req.headers.authorization.split(" ")[1];
  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  SystemStatus.findOne({}).exec(function (err, SystemStatus) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!SystemStatus) return res.error({ message: "System status not found" });

    SystemStatus.lastMangaChapterId += 1;

    let chapter = new Chapter({
      id: "chapter_m" + SystemStatus.lastMangaChapterId,
      mangaId: req.body.mangaId,
      sectionId: req.body.sectionId,
      title: req.body.title,
      creator: user.name,
    });

    JSZip.loadAsync(req.file.buffer).then(function (zip) {
      // check if folder exists in zip
      if (zip.folder(/(.*\/)/).length > 0) {
        console.log(zip.folder(/(.*\/)/));
        return res.status(400).json({ error: "Zip file contains a directory" });
      }
      // check if zip files contain a string file name
      if (zip.file(/([^\d]+)\..*/).length > 0) {
        console.log(zip.file(/^\d$/));
        return res
          .status(400)
          .json({ error: "Zip file contains a non-number name" });
      }
      let listPages = [];
      let listPromises = [];
      zip.file(/.*/).map(function (zipEntry) {
        // extract image with binary data
        const buffer = zipEntry.async("arraybuffer");
        const setParams = buffer.then(async function (content) {
          return {
            Path: `manga/${req.body.mangaId}/${req.body.sectionId}/${chapter.id}/${zipEntry.name}`,
            Data: Buffer.from(content),
          };
        });
        const upload = setParams.then(async function (params) {
          return await bucket
            .file(params.Path)
            .save(params.Data, _const.GCP_FILE_METADATA)
            .then(() => {
              listPages.push({
                pageNumber: zipEntry.name.replace(/\.[^.]+$/, ""),
                pageUrl: process.env.GCP_STORAGE_URL + params.Path,
              });
            });
        });
        listPromises.push(upload);
      });

      // wait for all promises to resolve
      Promise.all(listPromises).then(() => {
        listPages.sort((a, b) => {
          return a.pageNumber - b.pageNumber;
        });
        chapter.pages = listPages;
        // update manga
        Manga.findOne({ id: req.body.mangaId }).exec(function (err, manga) {
          if (err)
            return res.internal({
              message: "Error occurred",
              errors: err,
            });
          if (!manga) return res.error({ message: `Manga not found` });
          // update section
          Section.findOne({ id: req.body.sectionId })
            .populate("chapters", "id")
            .exec(function (err, section) {
              if (err)
                return res.internal({
                  message: "Error occurred",
                  errors: err,
                });
              if (!section)
                return res.error({
                  message: `Section not found`,
                });

              if (!section.chapters)
                return res.internal({
                  message: `Section chapters not found`,
                });
              section.chapters.push(chapter._id);

              section.markModified("chapters");

              chapter.save((err) => {
                if (err)
                  return res.error({
                    message: `Create chapter failed`,
                    errors: err,
                  });
                section.save((err) => {
                  if (err)
                    return res.error({
                      message: `Add chapter to section failed`,
                      errors: err,
                    });
                  SystemStatus.save((err) => {
                    if (err)
                      return res.error({
                        message: "Update manga status failed",
                        errors: err,
                      });
                    res.created({
                      message: `Chapter ${chapter.id} created!`,
                      result: chapter,
                    });
                  });
                });
              });
            });
        });
      });
    });
  });
};

const UpdateManga = (req, res) => {
  if (!req.body.id) return res.error({ message: "Manga ID is required" });

  Manga.findOne({ id: req.body.id }).exec(function (err, manga) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!manga) return res.error({ message: "Manga not found" });

    if (req.body.title) manga.title = req.body.title;
    if (req.file) {
      const filePath = `manga/${manga.id}/cover${path.extname(
        req.file.originalname
      )}`;
      bucket.file(filePath).save(
        req.file.buffer,
        {
          metadata: {
            contentType: req.file.mimetype,
            cacheControl: "private",
          },
        },
        (err) => {
          if (err) return console.log(err);
        }
      );
      manga.cover = process.env.GCP_STORAGE_URL + filePath;
    }
    if (req.body.author) manga.author = req.body.author;
    if (req.body.artist) manga.artist = req.body.artist;
    if (req.body.description) manga.description = req.body.description;
    if (req.body.status) manga.status = req.body.status;
    if (req.body.tags)
      manga.tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    if (req.body.otherNames)
      manga.otherNames = req.body.otherNames
        ? JSON.parse(req.body.otherNames)
        : [];

    manga.save((err) => {
      if (err)
        return res.error({
          message: "Update manga failed",
          errors: err,
        });
      res.updated({ message: "Manga updated!", result: manga });
    });
  });
};

const UpdateSection = (req, res) => {
  if (!req.body.id) return res.error({ message: "Section ID is required" });

  Section.findOne({ id: req.body.id }).exec(function (err, section) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!section) return res.error({ message: "Section not found" });

    if (req.body.name) section.name = req.body.name;
    if (req.file) {
      const filePath = `manga/${section.mangaId}/${
        section.id
      }_cover${path.extname(req.file.originalname)}`;
      bucket.file(filePath).save(
        req.file.buffer,
        {
          metadata: {
            contentType: req.file.mimetype,
            cacheControl: "private",
          },
        },
        (err) => {
          if (err) return console.log(err);
        }
      );
      section.cover = process.env.GCP_STORAGE_URL + filePath;
    }

    section.save((err) => {
      if (err)
        return res.error({
          message: "Update section failed",
          errors: err,
        });
      res.updated({ message: "Section updated!", result: section });
    });
  });
};

const UpdateChapter = (req, res) => {
  if (!req.body.id) return res.error({ message: "Chapter ID is required" });

  Chapter.findOne({ id: req.body.id }).exec(async function (err, chapter) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!chapter) return res.error({ message: "Chapter not found" });

    if (req.file) {
      if (path.extname(req.file?.originalname) !== ".zip") {
        return res.status(400).json({ error: "File must be a zip file" });
      }

      // Get a list of all the objects in the folder
      const [objects] = await bucket.getFiles({
        prefix: `manga/${chapter.mangaId}/${chapter.sectionId}/${chapter.id}`,
      });

      // Delete all the objects
      for (const object of objects) {
        await object.delete();
      }

      await JSZip.loadAsync(req.file.buffer).then(function (zip) {
        // check if folder exists in zip
        if (zip.folder(/(.*\/)/).length > 0) {
          console.log(zip.folder(/(.*\/)/));
          return res
            .status(400)
            .json({ error: "Zip file contains a directory" });
        }
        // check if zip files contain a string file name
        if (zip.file(/([^\d]+)\..*/).length > 0) {
          console.log(zip.file(/^\d$/));
          return res
            .status(400)
            .json({ error: "Zip file contains a non-number name" });
        }
        let listPages = [];
        let listPromises = [];
        zip.file(/.*/).map(function (zipEntry) {
          // extract image with binary data
          const buffer = zipEntry.async("arraybuffer");
          const setParams = buffer.then(async function (content) {
            return {
              Path: `manga/${chapter.mangaId}/${chapter.sectionId}/${chapter.id}/${zipEntry.name}`,
              Data: Buffer.from(content),
            };
          });
          const upload = setParams.then(async function (params) {
            return await bucket
              .file(params.Path)
              .save(params.Data, _const.GCP_FILE_METADATA)
              .then(() => {
                listPages.push({
                  pageNumber: zipEntry.name.replace(/\.[^.]+$/, ""),
                  pageUrl: process.env.GCP_STORAGE_URL + params.Path,
                });
              });
          });
          listPromises.push(upload);
        });

        // wait for all promises to resolve
        Promise.all(listPromises).then(() => {
          listPages.sort((a, b) => {
            return a.pageNumber - b.pageNumber;
          });
          chapter.pages = listPages;
          if (req.body.title) chapter.title = req.body.title;
          chapter.markModified("pages");
          // update chapter
          chapter.save((err) => {
            if (err)
              return res.error({
                message: "Update chapter failed",
                errors: err,
              });
            res.updated({
              message: "Chapter updated!",
              result: chapter,
            });
          });
        });
      });
    }
  });
};

const DeleteManga = (req, res) => {
  if (!req.body.id) return res.error({ message: "Manga ID is required" });

  Manga.findOne({ id: req.body.id }).exec(function (err, manga) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!manga) return res.error({ message: "Manga not found" });

    manga.deletedAt = Date.now();
    manga.save((err) => {
      if (err)
        return res.error({
          message: "Delete manga failed",
          errors: err,
        });
      res.success({ message: "Manga deleted!" });
    });
  });
};

const DeleteSection = (req, res) => {
  if (!req.body.id) return res.error({ message: "Section ID is required" });

  Section.findOne({ id: req.body.id }).exec(function (err, section) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!section) return res.error({ message: "Section not found" });

    section.deletedAt = Date.now();
    section.save((err) => {
      if (err)
        return res.error({
          message: "Delete section failed",
          errors: err,
        });
      res.success({ message: "Section deleted!" });
    });
  });
};

const DeleteChapter = (req, res) => {
  if (!req.body.id) return res.error({ message: "Chapter ID is required" });

  Chapter.findOne({ id: req.body.id }).exec(function (err, chapter) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!chapter) return res.error({ message: "Chapter not found" });

    chapter.deletedAt = Date.now();
    chapter.save((err) => {
      if (err)
        return res.error({
          message: "Delete chapter failed",
          errors: err,
        });
      res.success({ message: "Chapter deleted!" });
    });
  });
};

const RestoreManga = (req, res) => {
  if (!req.body.id) return res.error({ message: "Manga ID is required" });

  Manga.findOne({ id: req.body.id }).exec(function (err, manga) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!manga) return res.error({ message: "Manga not found" });

    manga.deletedAt = null;
    manga.save((err) => {
      if (err)
        return res.error({
          message: "Restore manga failed",
          errors: err,
        });
      res.success({ message: "Manga restored!" });
    });
  });
};

const RestoreSection = (req, res) => {
  if (!req.body.id) return res.error({ message: "Section ID is required" });

  Section.findOne({ id: req.body.id }).exec(function (err, section) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!section) return res.error({ message: "Section not found" });

    section.deletedAt = null;
    section.save((err) => {
      if (err)
        return res.error({
          message: "Restore section failed",
          errors: err,
        });
      res.success({ message: "Section restored!" });
    });
  });
};

const RestoreChapter = (req, res) => {
  if (!req.body.id) return res.error({ message: "Chapter ID is required" });

  Chapter.findOne({ id: req.body.id }).exec(function (err, chapter) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!chapter) return res.error({ message: "Chapter not found" });

    chapter.deletedAt = null;
    chapter.save((err) => {
      if (err)
        return res.error({
          message: "Restore chapter failed",
          errors: err,
        });
      res.success({ message: "Chapter restored!" });
    });
  });
};

const AddHistory = (req, res) => {
  if (!req.body.username) return res.error({ message: "Username is required" });
  if (!req.body.mangaId) return res.error({ message: "Manga ID is required" });
  if (!req.body.chapterId)
    return res.error({ message: "Chapter ID is required" });

  User.findOne({ name: req.body.username }).exec(function (err, user) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!user) return res.error({ message: "User not found" });

    const newHistory = {
      mangaId: req.body.mangaId,
      mangaTitle: req.body.mangaTitle,
      mangaCover: req.body.mangaCover,
      chapterId: req.body.chapterId,
      chapterTitle: req.body.chapterTitle,
      lastRead: Date.now(),
    };

    let checkExist = false;

    // Check if manga is already in history
    for (let history of user.history.manga) {
      if (history.mangaId === req.body.mangaId) {
        checkExist = true;
        // Only update chapter if it's different
        if (history.chapterId !== req.body.chapterId) {
          history.chapterId = req.body.chapterId;
          history.chapterTitle = req.body.chapterTitle;
        } else {
          return res.success({ message: "History already exists" });
        }
      }
    }

    if (!checkExist) {
      user.history.manga.push(newHistory);
    }

    user.markModified("history.manga");

    user.save((err) => {
      if (err)
        return res.error({
          message: "Add history failed",
          errors: err,
        });
      res.success({ message: "History added" });
    });
  });
};

const GetHistory = (req, res) => {
  if (!req.query.username)
    return res.error({ message: "Username is required" });

  User.findOne({ name: req.query.username }).exec(function (err, user) {
    if (err) return res.internal({ message: "Error occurred", errors: err });
    if (!user) return res.error({ message: "User not found" });

    res.success({
      message: "History found",
      result: user.history.manga.slice(0, 10),
    });
  });
};

export {
  GetMangaList,
  GetManga,
  CreateManga,
  CreateSection,
  CreateChapter,
  GetChapter,
  AddHistory,
  GetHistory,
  GetMangaUpdate,
  GetSection,
  UpdateSection,
  UpdateChapter,
  UpdateManga,
  GetLastUpdate,
  DeleteManga,
  DeleteSection,
  DeleteChapter,
  RestoreManga,
  RestoreSection,
  RestoreChapter,
};
