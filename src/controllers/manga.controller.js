import fs from 'fs';
import JSZip from 'jszip';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import s3 from '../libs/S3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GetAll = async (req, res) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Delimiter: '/',
            Prefix: 'manga/',
        };
        const data = await s3.listObjectsV2(params).promise();
        const manga = data.Contents.map((item) => {
            const name = item.Key.split('/')[1];
            return {
                name,
                url: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${item.Key}`,
            };
        });
        return res.status(200).json(manga);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const Unzip = async (req, res) => {
    const filePath = (path.join(__dirname, '../../') + req.file.path);
    const extractFolder = filePath.replace(/\.[^.]+$/, '') + '\\';
    // console.log(filePath);
    console.log(extractFolder);
    fs.readFile(filePath, function (err, data) {
        if (err) throw err;

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

            zip.forEach(function (relativePath, zipEntry) {
                fs.mkdirSync(extractFolder, { recursive: true });
                // extract image with binary data
                zipEntry.async('arraybuffer').then(function (content) {
                    fs.writeFileSync(extractFolder + zipEntry.name, Buffer(content));
                }).catch((err) => {
                    console.log(err);
                    throw new Error('Error extracting zip file');
                });
            });
        }).then(() => {
            res.status(200).json({ message: 'Unzipped!' });
        }).catch((err) => {
            res.status(500).json({ error: err.message });
        });
    });
}

const Upload = async (req, res) => {
    const file = req.files.file;
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Folder: 'manga',
        Key: file.name,
    };

    s3.upload(params, (err, data) => {
        if (err) {
            res.status(500).send(err);
        }
        res.status(200).send(data);
        console.log(`File uploaded successfully. ${data.Location}`);
    });
}

export { GetAll, Upload, Unzip };

