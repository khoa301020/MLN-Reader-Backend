import fs from 'fs';
import JSZip from 'jszip';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import s3 from '../libs/S3.js';
import Manga from '../models/manga.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GetAll = async (req, res) => {

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
            });
        }
    });
};

const UploadChapter = (req, res) => {
    if (path.extname(req.file.originalname) !== '.zip') {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'File must be a zip file' })
    };
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
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: req.body.manga_id + '/' + req.body.chapter + '/' + zipEntry.name,
                        Body: Buffer.from(content),
                    }
                });
                const upload = setParams.then(async function (params) {
                    return await s3.upload(params).promise().then(function (data) {
                        listPages.push({
                            pageNumber: zipEntry.name.replace(/\.[^.]+$/, ''),
                            image: data.Location,
                        }
                        );
                    });
                });
                listPromises.push(upload);
            });

            // wait for all promises to resolve
            Promise.all(listPromises).then(() => {
                // update manga
                Manga.findOneAndUpdate(
                    { id: req.body.manga_id },
                    { $push: { chapters: { chapterNumber: req.body.chapter, pages: listPages } } },
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
};

export { GetAll, CreateManga, UploadChapter };

