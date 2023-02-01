import axios from "axios";
import fs from "fs";
import path from "path";

// Returns a Promise that resolves after "ms" Milliseconds
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function importAll() {
  const baseUrl = "http://localhost:3333/api/novel/create-action";
  const jsonsInDir = fs
    .readdirSync("./crawler/data")
    .filter((file) => path.extname(file) === ".json");

  const novelPromises = [];
  for (const file of jsonsInDir) {
    const fileData = fs.readFileSync(path.join("./crawler/data", file), "utf8");
    const novel = JSON.parse(fileData.toString());
    const createNovel = await axios
      .post(baseUrl, {
        subject: "novel",
        title: novel.info.title,
        cover: novel.info.cover,
        author: novel.info.author,
        artist: novel.info.artist,
        status: novel.info.status,
        otherNames: novel.info.otherNames,
        description: novel.info.description,
        uploader: "user_1",
        tags: novel.info.tags,
      })
      .then(async (resNovel) => {
        console.log(resNovel.data.message);
        const sectionPromises = [];
        for (const section of novel.sections) {
          const createSection = await axios
            .post(baseUrl, {
              subject: "section",
              novelId: resNovel.data.result.id,
              cover: section.cover,
              name: section.name,
            })
            .then(async (resSection) => {
              console.log(resSection.data.message);
              const chapterPromises = [];
              for (const chapter of section.chapters) {
                const createChapter = await axios
                  .post(baseUrl, {
                    subject: "chapter",
                    novelId: resNovel.data.result.id,
                    sectionId: resSection.data.result.id,
                    title: chapter.title,
                    content: chapter.content,
                    wordCount: chapter.wordCount,
                  })
                  .then(async (resChapter) => {
                    console.log(resChapter.data.message);
                    const notePromises = [];
                    for (const note of chapter.notes) {
                      const createNote = await axios
                        .post(baseUrl, {
                          subject: "note",
                          chapterId: resChapter.data.result.id,
                          content: note.content,
                        })
                        .then((resNote) => {
                          console.log(resNote.data.message);
                        })
                        .catch((err) => {
                          console.log(err.request);
                        });
                      notePromises.push(await timer(0).then(() => createNote));
                    }
                    Promise.all(notePromises).then(() => {
                      return;
                    });
                  })
                  .catch((err) => {
                    console.log(err.request);
                  });
                chapterPromises.push(await timer(0).then(() => createChapter));
              }
              Promise.all(chapterPromises).then(() => {
                return;
              });
            })
            .catch((err) => {
              console.log(err.request);
            });
          sectionPromises.push(await timer(0).then(() => createSection));
        }
        Promise.all(sectionPromises).then(() => {
          return;
        });
      })
      .catch((err) => {
        console.log(err.request);
      });
    novelPromises.push(await timer(0).then(() => createNovel));
  }
  Promise.all(novelPromises).then(() => {
    console.log("Done!");
    return;
  });
}

await importAll();

async function importTags() {
  const baseUrl = "http://localhost:3333/api/common/tag-action";
  const jsonsInDir = fs
    .readdirSync("./crawler/data")
    .filter((file) => path.extname(file) === ".json");

  const tags = [];

  for (const file of jsonsInDir) {
    const fileData = fs.readFileSync(path.join("./crawler/data", file), "utf8");
    const novel = JSON.parse(fileData.toString());

    for (const tag of novel.info.tags) {
      if (!tags.some((e) => e.code === tag.code)) {
        tags.push({ name: tag.name, code: tag.code });
      }
    }
  }

  tags.sort((a, b) => b.code - a.code);

  fs.writeFileSync("./crawler/tags.json", JSON.stringify(tags, null, 4));

  const promises = [];
  for (const tag of tags) {
    const create = await axios
      .post(baseUrl, {
        action: "create",
        name: tag.name,
        code: tag.code,
      })
      .then((res) => {
        console.log(res.data.result);
      })
      .catch((err) => {
        console.log(err.message);
      });
    promises.push(await timer(1000).then(() => create));
  }
  Promise.all(promises).then(() => {
    console.log("Done!");
    return;
  });
}

// await importTags();
