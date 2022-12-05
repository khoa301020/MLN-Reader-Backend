import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import pretty from "pretty";

function prettyAll() {
    const jsonsInDir = fs.readdirSync('./crawler/backup').filter(file => path.extname(file) === '.json');

    jsonsInDir.forEach(file => {
        const fileData = fs.readFileSync(path.join('./crawler/backup', file), 'utf8');
        const novel = JSON.parse(fileData.toString());

        for (const section of novel.sections) {
            for (const chapter of section.chapters) {
                try {
                    const $ = cheerio.load(chapter.content);

                    $('h3+p+p+a+a').remove();
                    $('h3+p+p+a').remove();
                    $('h3+p+p').remove();
                    $('h3+p').remove();
                    $('h3').remove();

                    chapter.note = pretty($('.note-reg').html());
                    $('.note-reg').remove();
                    chapter.content = pretty($('*').html());
                } catch (error) {
                    console.log(chapter);
                    console.log(error);
                }
            }
        }

        fs.writeFileSync(path.join('./crawler/data', file), JSON.stringify(novel));
        console.log(`Done: ${file}`);
    });
}

prettyAll();