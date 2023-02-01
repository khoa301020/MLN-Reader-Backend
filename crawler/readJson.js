import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { Manga } from "../src/models/manga.model.js";
import { Novel } from "../src/models/novel.model.js";

function prettyAll() {
  const jsonsInDir = fs
    .readdirSync("./crawler/backup")
    .filter((file) => path.extname(file) === ".json");

  let noteCount = 1;
  jsonsInDir.forEach((file) => {
    const fileData = fs.readFileSync(
      path.join("./crawler/backup", file),
      "utf8"
    );
    const novel = JSON.parse(fileData.toString());
    novel.description = novel.description.trim();

    novel.info = {
      title: novel.title,
      url: novel.url,
      cover: novel.cover,
      author: novel.author,
      artist: novel.artist,
      status: novel.status,
      otherNames: novel.otherNames,
      description: novel.description,
      uploader: novel.uploader,
      tags: novel.tags,
      followCount: novel.followCount,
      wordCount: novel.wordCount,
      viewCount: novel.viewCount,
      ratingCount: novel.ratingCount,
      lastUpdate: novel.lastUpdate,
    };

    delete novel.title;
    delete novel.url;
    delete novel.cover;
    delete novel.author;
    delete novel.artist;
    delete novel.status;
    delete novel.otherNames;
    delete novel.description;
    delete novel.uploader;
    delete novel.tags;
    delete novel.followCount;
    delete novel.wordCount;
    delete novel.viewCount;
    delete novel.ratingCount;
    delete novel.lastUpdate;

    const section = novel.sections;
    delete novel.sections;
    novel.sections = section;

    for (const section of novel.sections) {
      section.cover = section.sectionCover;
      delete section.sectionCover;
      for (const chapter of section.chapters) {
        try {
          let $ = cheerio.load(chapter.content);

          $("h3+p+p+a+a").remove();
          $("h3+p+p+a").remove();
          $("h3+p+p").remove();
          $("h3+p").remove();
          $("h3").remove();

          chapter.notes = [];
          $(".note-reg>div").each((i, el) => {
            const note = "note" + noteCount++;
            const noteId = $(el).attr("id");
            // check p in $2 text contains noteId and replace with note
            $("p").each((i, el) => {
              if ($(el).text().includes(noteId)) {
                $(el).text($(el).text().replace(noteId, note));
              }
            });
            const noteContent = $(el).find("span.note-content_real").html();
            chapter.notes.push({ id: note, content: noteContent });
          });

          $(".note-reg").remove();
          $("head").remove();

          chapter.content = $("body").html().trim();
        } catch (error) {
          console.log(chapter);
          console.log(error);
        }
      }
    }

    fs.writeFileSync(path.join("./crawler/data", file), JSON.stringify(novel));
    console.log(`Done: ${file}`);
  });
}

async function addDescription() {
  const jsonsInDir = fs
    .readdirSync("./crawler/backup")
    .filter((file) => path.extname(file) === ".json");

  jsonsInDir.forEach(async (file) => {
    const fileData = fs.readFileSync(
      path.join("./crawler/backup", file),
      "utf8"
    );
    const novel = JSON.parse(fileData.toString());

    await axios.get(novel.url).then((res) => {
      const $ = cheerio.load(res.data);
      novel.cover = $(".series-cover .img-in-ratio")
        .attr("style")
        .split("'")[1];
      novel.otherNames = $(".fact-value div")
        .toArray()
        .map((e) => $(e).text().trim());
      novel.description = $(".summary-content").text().trim();

      for (const section of novel.sections) {
        $("section.volume-list").each((i, el) => {
          const sectionId = $(el).find(".sect-header").attr("id");
          if (sectionId === section.id) {
            section.cover = $(el)
              .find(".img-in-ratio")
              .attr("style")
              .split("'")[1];
          }
        });
      }
    });

    fs.writeFileSync(
      path.join("./crawler/backup", file),
      JSON.stringify(novel)
    );
    console.log(`Done: ${file}`);
  });
}

function addBookToUser() {
  try {
    const items = ["user_2", "user_3", "user_4"];
    Novel.find({}).exec((err, novels) => {
      console.log(novels.length);
      for (const novel of novels) {
        console.log(novel.title);
        novel.uploader = items[Math.floor(Math.random() * items.length)];
        novel.save();
      }
    });
    Manga.find({}).exec((err, mangas) => {
      console.log(mangas.length);
      for (const manga of mangas) {
        console.log(manga.title);
        manga.uploader = items[Math.floor(Math.random() * items.length)];
        manga.save();
      }
    });
  } catch (error) {
    console.log(error);
  }
}

// prettyAll();
// await addDescription();
addBookToUser();
