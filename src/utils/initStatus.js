import { MangaStatus } from "../models/manga.model.js";
import { NovelStatus } from "../models/novel.model.js";


function initStatus() {
    // check if novel status exists
    NovelStatus.findOne({}, function (err, novelStatus) {
        if (!novelStatus) {
            const novelStatus = new NovelStatus;
            novelStatus.save();
        }
    });
    // check if manga status exists
    MangaStatus.findOne({}, function (err, mangaStatus) {
        if (!mangaStatus) {
            const mangaStatus = new MangaStatus;
            mangaStatus.save();
        }
    });
}

export default initStatus;