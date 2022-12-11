import axios from "axios";
import fs from "fs";
import path from "path";

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms));

async function importAll() {
    const baseUrl = "http://localhost:3333/api/novel";
    const jsonsInDir = fs.readdirSync('./crawler/data').filter(file => path.extname(file) === '.json');

    const novelPromises = [];
    for (const file of jsonsInDir) {
        const fileData = fs.readFileSync(path.join('./crawler/data', file), 'utf8');
        const novel = JSON.parse(fileData.toString());
        const novelUrl = `${baseUrl}/create-novel`;
        const createNovel = await axios.post(novelUrl, {
            hakoId: novel.id,
            info: novel.info,
        }).then(async resNovel => {
            console.log(resNovel.data.message);
            const sectionPromises = [];
            for (const section of novel.sections) {
                const sectionUrl = `${baseUrl}/create-section`;
                const createSection = await axios.post(sectionUrl, {
                    novelId: resNovel.data.result.id,
                    hakoId: section.id,
                    cover: section.cover,
                    name: section.name,
                }).then(async resSection => {
                    console.log(resSection.data.message);
                    const chapterPromises = [];
                    for (const chapter of section.chapters) {
                        const chapterUrl = `${baseUrl}/create-chapter`;
                        const createChapter = await axios.post(chapterUrl, {
                            sectionId: resSection.data.result.id,
                            hakoId: chapter.id,
                            title: chapter.title,
                            url: chapter.url,
                            content: chapter.content,
                            wordCount: chapter.wordCount,
                            lastUpdate: chapter.lastUpdate,
                        }).then(async resChapter => {
                            console.log(resChapter.data.message);
                            const notePromises = [];
                            for (const note of chapter.notes) {
                                const noteUrl = `${baseUrl}/create-note`;
                                const createNote = await axios.post(noteUrl, {
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