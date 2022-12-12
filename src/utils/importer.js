import axios from "axios";
import fs from "fs";
import path from "path";

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms));

async function importAll() {
    const baseUrl = "http://localhost:3333/api/novel/create-action";
    const jsonsInDir = fs.readdirSync('./crawler/data').filter(file => path.extname(file) === '.json');

    const novelPromises = [];
    for (const file of jsonsInDir) {
        const fileData = fs.readFileSync(path.join('./crawler/data', file), 'utf8');
        const novel = JSON.parse(fileData.toString());
        const createNovel = await axios.post(baseUrl, {
            subject: "novel",
            hakoId: novel.id,
            hakoUrl: novel.info.url,
            title: novel.info.title,
            cover: novel.info.cover,
            author: novel.info.author,
            artist: novel.info.artist,
            status: novel.info.status,
            otherNames: novel.info.otherNames,
            description: novel.info.description,
            uploader: {
                userId: novel.info.uploader.id,
                userName: novel.info.uploader.name,
            },
            tags: novel.info.tags,
        }).then(async resNovel => {
            console.log(resNovel.data.message);
            const sectionPromises = [];
            for (const section of novel.sections) {
                const createSection = await axios.post(baseUrl, {
                    subject: "section",
                    novelId: resNovel.data.result.id,
                    hakoId: section.id,
                    cover: section.cover,
                    name: section.name,
                }).then(async resSection => {
                    console.log(resSection.data.message);
                    const chapterPromises = [];
                    for (const chapter of section.chapters) {
                        const createChapter = await axios.post(baseUrl, {
                            subject: "chapter",
                            sectionId: resSection.data.result.id,
                            hakoId: chapter.id,
                            title: chapter.title,
                            hakoUrl: chapter.url,
                            content: chapter.content,
                            wordCount: chapter.wordCount,
                        }).then(async resChapter => {
                            console.log(resChapter.data.message);
                            const notePromises = [];
                            for (const note of chapter.notes) {
                                const createNote = await axios.post(baseUrl, {
                                    subject: "note",
                                    chapterId: resChapter.data.result.id,
                                    hakoId: note.noteId,
                                    content: note.noteContent,
                                }).then(resNote => {
                                    console.log(resNote.data.message);
                                }).catch(err => {
                                    console.log(err);
                                });
                                notePromises.push(await timer(0).then(() => createNote));
                            }
                            Promise.all(notePromises).then(() => {
                                return;
                            });
                        }).catch(err => {
                            console.log(err);
                        });
                        chapterPromises.push(await timer(0).then(() => createChapter));
                    }
                    Promise.all(chapterPromises).then(() => {
                        return;
                    });
                }).catch(err => {
                    console.log(err);
                });
                sectionPromises.push(await timer(0).then(() => createSection));
            }
            Promise.all(sectionPromises).then(() => {
                return;
            });
        }).catch(err => {
            console.log(err);
        });
        novelPromises.push(await timer(0).then(() => createNovel));
    }
    Promise.all(novelPromises).then(() => {
        console.log("Done!");
        return;
    });
}

await importAll();