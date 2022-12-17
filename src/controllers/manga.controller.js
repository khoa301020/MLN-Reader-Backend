import fs from 'fs';
import JSZip from 'jszip';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import _const from '../constants/const.js';
import * as Helper from '../helper/helper.js';
import bucket from '../libs/GCP-Storage.js';
import { SystemStatus } from '../models/common.model.js';
import { Chapter, Manga, Section } from '../models/manga.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GetMangaList = async (req, res) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const sort = req.query.sort;

    const select = "id title cover description rating followers statistics";

    Manga.find({}).select(select).sort(_const.QUERY_SORT[sort]).skip((page - 1) * limit).limit(limit).exec((err, mangas) => {
        if (err) return res.error({ message: "Get manga list failed", errors: err });
        res.success({ message: "Get manga list successfully", result: mangas });
    });
};

const GetManga = (req, res) => {
    if (!req.query.mangaId) return res.error({ message: "Manga id is required" });

    Manga.findOne({ id: req.query.mangaId })
        .populate({
            path: 'sections',
            populate: { path: 'chapters', select: '-content -notes -hakoUrl' }
        }).exec((err, manga) => {
            if (err) return res.error({ message: "Get manga failed", errors: err });
            if (!manga) return res.error({ message: "Manga not found" });

            res.success({ message: "Get manga successfully", result: manga });
        });
};

const CreateAction = (req, res) => {
    if (!req.body.subject) return res.error({ message: "Subject is required" });
    if (!_const.MANGA_SUBJECTS.includes(req.body.subject)) return res.error({ message: "Subject is invalid" });

    let parentName, ParentModel, parentIdProperty, lastIdProperty, entity, prefix;

    console.log(req.body.tags);

    switch (req.body.subject) {
        case 'manga':
            lastIdProperty = "lastMangaId";
            entity = new Manga({
                title: req.body.title,
                cover: req.body.cover,
                author: req.body.author,
                artist: req.body.artist,
                status: req.body.status,
                otherNames: req.body.otherNames ? JSON.parse(req.body.otherNames) : [],
                description: req.body.description,
                uploader: req.body.uploader,
                tags: JSON.parse(req.body.tags),
            });
            prefix = "manga_";
            break;
        case 'section':
            parentName = "manga";
            ParentModel = Manga;
            parentIdProperty = "mangaId";
            lastIdProperty = "lastMangaSectionId";
            entity = new Section({
                mangaId: req.body.mangaId,
                hakoId: req.body.hakoId,
                cover: req.body.cover,
                name: req.body.name,
            });
            prefix = "volume_n";
            break;
        case 'chapter':
            parentName = "section";
            ParentModel = Section;
            parentIdProperty = "sectionId";
            lastIdProperty = "lastMangaChapterId";
            entity = new Chapter({
                mangaId: req.body.mangaId,
                sectionId: req.body.sectionId,
                hakoId: req.body.hakoId,
                hakoUrl: req.body.hakoUrl,
                title: req.body.title,
                content: req.body.content,
                wordCount: req.body.wordCount,
            });
            prefix = "chapter_n";
            break;
        default:
            return res.error({ message: "Subject is invalid" });
    }

    SystemStatus.findOne({}).exec(function (err, SystemStatus) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!SystemStatus) return res.error({ message: "System status not found" });
        if (!ParentModel) {
            SystemStatus[lastIdProperty] += 1;

            const target = entity;
            target.id = prefix + SystemStatus[lastIdProperty];

            if (req.file) {
                const filePath = `manga/${target.id}/cover${path.extname(req.file.originalname)}`
                bucket.file(filePath)
                    .save(req.file.buffer, {
                        metadata: {
                            contentType: req.file.mimetype,
                        },
                    }, (err) => {
                        if (err) return console.log(err);
                    });
                target.cover = process.env.GCP_STORAGE_URL + filePath;
            } else {
                target.cover = process.env.HAKO_DEFAULT_COVER;
            }

            target.save((err) => {
                if (err) return res.error({ message: `Create ${req.body.subject} failed`, errors: err });
                SystemStatus.save((err) => {
                    if (err) return res(err);
                    res.created({ message: `${Helper.capitalizeFirstLetter(req.body.subject)} ${target.id} created!`, result: target });
                });
            });
        } else {
            ParentModel.findOne({ id: req.body[parentIdProperty], }).populate(`${req.body.subject}s`, "id").exec(function (err, parent) {
                if (err) return res.internal({ message: "Error occurred", errors: err });
                if (!parent) return res.error({ message: `${Helper.capitalizeFirstLetter(parentName)} not found` });

                SystemStatus[lastIdProperty] += 1;

                const target = entity;
                target.id = prefix + SystemStatus[lastIdProperty];

                if (req.file && req.body.subject === "section") {
                    const filePath = `manga/${parent.mangaId}/${target.id}/cover${path.extname(req.file.originalname)}`

                    bucket.file(filePath)
                        .save(req.file.buffer, {
                            metadata: {
                                contentType: req.file.mimetype,
                            },
                        }, (err) => {
                            if (err) return console.log(err);
                        });
                    target.cover = process.env.GCP_STORAGE_URL + filePath;
                } else {
                    target.cover = process.env.HAKO_DEFAULT_COVER;
                }

                if (!parent[`${req.body.subject}s`]) return res.internal({ message: `${Helper.capitalizeFirstLetter(parentName)} ${req.body.subject}s not found` });
                parent[`${req.body.subject}s`].push(target._id);

                target.save((err) => {
                    if (err) return res.error({ message: `Create ${req.body.subject} failed`, errors: err });
                    parent.save((err) => {
                        if (err) return res.error({ message: `Add ${req.body.subject} to ${parentName} failed`, errors: err });
                        SystemStatus.save((err) => {
                            if (err) return res.error({ message: "Update manga status failed", errors: err });
                            res.created({ message: `${Helper.capitalizeFirstLetter(req.body.subject)} ${target.id} created!`, result: target });
                        });
                    });
                });
            });
        }
    })
};

const UploadChapter = (req, res) => {
    if (path.extname(req.file.originalname) !== '.zip') {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'File must be a zip file' })
    };

    try {
        const filePath = path.join(__dirname, '../../') + req.file.path;
        fs.readFile(filePath, function (_err, data) {
            JSZip.loadAsync(data).then(function (zip) {
                // check if folder exists in zip
                if (zip.folder(/(.*\/)/).length > 0) {
                    console.log(zip.folder(/(.*\/)/));
                    throw new Error('Zip file contains a directory');
                }
                // check if zip files contain a string file name
                if (zip.file(/([^\d]+)\..*/).length > 0) {
                    console.log(zip.file(/^\d$/));
                    throw new Error('Zip file contains a non-number name');
                }
                let listPages = [];
                let listPromises = [];
                zip.file(/.*/).map(function (zipEntry) {
                    // extract image with binary data
                    const buffer = zipEntry.async('arraybuffer');
                    const setParams = buffer.then(async function (content) {
                        return {
                            Path: req.body.manga_id + '/' + req.body.chapter_order + '/' + zipEntry.name,
                            Data: Buffer.from(content),
                        }
                    });
                    const upload = setParams.then(async function (params) {
                        return await bucket.file(params.Path).save(params.Data).then(() => {
                            listPages.push({
                                pageNumber: zipEntry.name.replace(/\.[^.]+$/, ''),
                                image: process.env.GCP_STORAGE_URL + params.Path,
                            });
                        });
                    });
                    listPromises.push(upload);
                });

                // wait for all promises to resolve
                Promise.all(listPromises).then(() => {
                    // update manga
                    Manga.findOneAndUpdate(
                        { id: req.body.manga_id },
                        {
                            $push: {
                                chapters: {
                                    chapterOrder: req.body.chapter_order,
                                    chapterTitle: req.body.chapter_title,
                                    pages: listPages
                                }
                            }
                        },
                        { new: true },
                        (err, manga) => {
                            if (err) {
                                res.status(400).send(err);
                            } else {
                                res.status(201).json({
                                    message: "Chapter uploaded!",
                                    manga: manga,
                                });
                            }
                        }
                    );
                });
            });
        });
        fs.unlinkSync(req.file.path);
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: "Bad request",
            error: err.message,
        });
    }
};

export { GetMangaList, GetManga, CreateAction, UploadChapter };

