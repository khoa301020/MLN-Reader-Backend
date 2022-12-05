import axios from "axios";
import * as cheerio from 'cheerio';
import fs from "fs";

// Returns a Promise that resolves after "ms" Milliseconds
const timer = ms => new Promise(res => setTimeout(res, ms));

const baseUrl = process.env.HAKO_BASE_URL

async function getNovel() {
    const timeOut = 3000;
    let listNovel = [];
    await axios.get(process.env.HAKO_TOP_URL).then((res) => {
        const $ = cheerio.load(res.data);
        $(".series-title a").each(async (i, e) => {
            const url = baseUrl + $(e).attr("href");
            const title = $(e).text();
            const id = url.split("/")[4].split("-")[0];
            const novel = {
                id,
                title,
                url,
            };
            listNovel.push(novel);
        });
    })

    // listNovel.length = 1;

    var chapterPromises = [];
    for (const novel of listNovel) {
        novel.tags = [];
        novel.sections = [];
        try {
            const getChapters = await axios.get(novel.url).then((res) => {
                const $ = cheerio.load(res.data);

                $("[x-show=\!more]").remove();
                $(".series-gerne-item").each((i, e) => {
                    const tags = {
                        code: $(e).attr("href").split("/")[4],
                        name: $(e).text().trim(),
                    }
                    novel.tags.push(tags);
                });

                $("section.volume-list").each((index, section) => {
                    const sectionId = $(section).find(".sect-header").attr("id");
                    const sectionName = $(section).find(".sect-header .sect-title").text().trim();
                    const sectionChapters = [];
                    $(section).find(".chapter-name a").each((i, e) => {
                        const chapter = {
                            id: $(e).attr("href").split("/")[3].split("-")[0],
                            title: $(e).text(),
                            url: baseUrl + $(e).attr("href"),
                        };
                        sectionChapters.push(chapter);
                    });

                    const sectionObj = {
                        id: sectionId,
                        name: sectionName,
                        chapters: sectionChapters,
                    }
                    novel.sections.push(sectionObj);
                });

                novel.uploader = {
                    id: $(".series-owner_name a").attr("href").split("/")[4],
                    name: $(".series-owner_name a").text(),
                }
                novel.author = $('.info-name:contains("Tác giả:")').next().children().text();
                novel.artist = $('.info-name:contains("Họa sĩ:")').next().children().text();
                novel.status = $('.info-name:contains("Tình trạng:")').next().children().text();
                novel.followCount = $(".feature-name").eq(0).text().match(/\d+/g).join("");
                novel.lastUpdate = $(".statistic-value").eq(0).find("time").attr("datetime");
                novel.wordCount = $(".statistic-value").eq(1).text().match(/\d+/g).join("");
                novel.ratingCount = $(".statistic-value").eq(2).text().match(/\d+/g).join("");
                novel.viewCount = $(".statistic-value").eq(3).text().match(/\d+/g).join("");

                console.log("[Novel crawled] " + novel.title);
            });
            chapterPromises.push(await timer(timeOut).then(() => getChapters));
            fs.writeFile('./crawler/data/' + novel.id + '.json', JSON.stringify(novel), (err) => {
                if (err) throw err;
            });
        } catch (error) {
            console.log(error);
        }
    };

    Promise.all(chapterPromises).then(() => {
        return listNovel;
    });

    var allChapterPromises = [];
    for (const novel of listNovel) {
        var contentPromises = [];
        for (const section of novel.sections) {
            for (const chapter of section.chapters) {
                try {
                    const getContent = await axios.get(chapter.url).then((res) => {
                        const $ = cheerio.load(res.data);
                        chapter.content = $("#chapter-content").html();
                        chapter.wordCount = $("h6.title-item").text().split("-")[0].match(/\d+/g).join("");
                        chapter.lastUpdate = $("h6.title-item .timeago").attr("datetime");
                        console.log("[Novel " + novel.id + " section " + section.id + " chapter " + chapter.id + " crawled]");
                    });
                    contentPromises.push(await timer(timeOut).then(() => getContent));
                } catch (error) {
                    console.log(error);
                }
            }
        }

        allChapterPromises.push(await Promise.all(contentPromises).then(() => {
            fs.writeFile('./crawler/data/' + novel.id + '.json', JSON.stringify(novel), (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }));
    }

    Promise.all(allChapterPromises).then(() => {
        console.log("Done");
    });
}

async function getContent() {
    const getContent = axios.get("https://docln.net/truyen/11586-shimotsuki-wa-mob-ga-suki/c92642").then((res) => {
        const $ = cheerio.load(res.data);
        const content = $("#chapter-content").html();
        const wordCount = $("h6.title-item").text().split("-")[0].match(/\d+/g).join("");
        const lastUpdate = $("h6.title-item .timeago").attr("datetime");
        const chapter = {
            content,
            wordCount,
            lastUpdate,
        };
        console.log(chapter);
    });
}

async function getChapter() {
    const timeOut = 3000;
    let listNovel = [];
    await axios.get("https://ln.hako.vn/danh-sach?truyendich=1&dangtienhanh=1&sapxep=top").then((res) => {
        const $ = cheerio.load(res.data);
        $(".series-title a").each(async (i, e) => {
            const url = baseUrl + $(e).attr("href");
            const title = $(e).text();
            const id = url.split("/")[4].split("-")[0];
            const novel = {
                id,
                title,
                url,
            };
            listNovel.push(novel);
        });
    })

    // listNovel.length = 1;

    var chapterPromises = [];
    for (const novel of listNovel) {
        novel.tags = [];
        novel.sections = [];
        try {
            const getChapters = await axios.get(novel.url).then((res) => {
                const $ = cheerio.load(res.data);

                $("[x-show=\!more]").remove();
                $(".series-gerne-item").each((i, e) => {
                    const tags = {
                        code: $(e).attr("href").split("/")[4],
                        name: $(e).text().trim(),
                    }
                    novel.tags.push(tags);
                });

                $("section.volume-list").each((index, section) => {
                    const sectionId = $(section).find(".sect-header").attr("id");
                    const sectionName = $(section).find(".sect-header .sect-title").text().trim();
                    const sectionChapters = [];
                    $(section).find(".chapter-name a").each((i, e) => {
                        const chapter = {
                            id: $(e).attr("href").split("/")[3].split("-")[0],
                            title: $(e).text(),
                            url: baseUrl + $(e).attr("href"),
                        };
                        sectionChapters.push(chapter);
                    });

                    const sectionObj = {
                        id: sectionId,
                        name: sectionName,
                        chapters: sectionChapters,
                    }
                    novel.sections.push(sectionObj);
                });

                novel.uploader = {
                    id: $(".series-owner_name a").attr("href").split("/")[4],
                    name: $(".series-owner_name a").text(),
                }
                novel.author = $('.info-name:contains("Tác giả:")').next().children().text();
                novel.artist = $('.info-name:contains("Họa sĩ:")').next().children().text();
                novel.status = $('.info-name:contains("Tình trạng:")').next().children().text();
                novel.followCount = $(".feature-name").eq(0).text().match(/\d+/g).join("");
                novel.lastUpdate = $(".statistic-value").eq(0).find("time").attr("datetime");
                novel.wordCount = $(".statistic-value").eq(1).text().match(/\d+/g).join("");
                novel.ratingCount = $(".statistic-value").eq(2).text().match(/\d+/g).join("");
                novel.viewCount = $(".statistic-value").eq(3).text().match(/\d+/g).join("");

                console.log("[Novel crawled] " + novel.title);
            });
            chapterPromises.push(await timer(timeOut).then(() => getChapters));
            fs.writeFile('./crawler/data/' + novel.id + '.json', JSON.stringify(novel), (err) => {
                if (err) throw err;
            });
        } catch (error) {
            console.log(error);
        }
    };
}

const NovelList = await getNovel();
// const NovelList = await getContent();
// const NovelList = await getChapter();
