import fs from 'fs';
import JSZip from 'jszip';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import bucket from '../libs/GCP-Storage.js';
import Manga from '../models/manga.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GetAll = async (req, res) => {
    try {
        const manga = await Manga.find({}, { id: 1, title: 1, chapters: 1 }).lean().exec();
        manga.forEach(e => {
            e.chaptersCount = e.chapters.length;
            delete e.chapters;
        });
        res.status(200).json({
            status: 200,
            mangaCount: manga.length,
            manga: manga,
        });
    } catch (err) {
        res.status(500).json({
            status: 500,
            message: "Internal server error",
            message: err.message,
        });
    }

};

const GetManga = (req, res) => {
    Manga.findOne({ id: req.body.manga_id }, (err, manga) => {
        if (err) {
            res.status(400).json({
                status: 400,
                message: "Manga not found!",
                error: err,
            });
        } else {
            res.status(200).json({
                status: 200,
                manga: manga,
            });
        }
    });
};

const CreateManga = (req, res) => {
    const manga = new Manga({
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description,
        cover: req.body.cover,
        chapters: [],
    });
    manga.save((err) => {
        if (err) {
            res.status(400).send(err);
        } else {
            res.status(201).json({
                message: "Manga created!",
                manga: manga,
            });
        }
    });
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

export { GetAll, GetManga, CreateManga, UploadChapter };

