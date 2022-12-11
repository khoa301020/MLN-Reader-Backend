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
                    const sectionCover = $(section).find(".sect-header .sect-cover img").attr("src");
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
                        cover: sectionCover,
                    }
                    novel.sections.push(sectionObj);
                });

                novel.uploader = {
                    id: $(".series-owner_name a").attr("href").split("/")[4],
                    name: $(".series-owner_name a").text(),
                }
                novel.otherNames = $(".fact-value").toArray().map((e) => $(e).text().trim());
                novel.cover = $(".series-cover .img-in-ratio").attr("style").split("'")[1];
                novel.author = $('.info-name:contains("Tác giả:")').next().children().text();
                novel.artist = $('.info-name:contains("Họa sĩ:")').next().children().text();
                novel.status = $('.info-name:contains("Tình trạng:")').next().children().text();
                novel.description = $('.summary-content').text();
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

async function bookbuy() {
    const url = "https://bookbuy.vn/api/CategoryApi/userMenuByMaincat/1";
    const baseUrl = "https://bookbuy.vn";

    const config = {
        headers: {
            "Accept-Encoding": "gzip, br",
        }
    }

    let listCategory = [];

    await axios.get(url, config).then(async (res) => {
        // await fetch(url, config).then(async (res) => {
        console.log("Start list category");
        const $ = cheerio.load(res.data);
        $("ul").first().children("li").each((i, e) => {
            const category = {
                code: $(e).find("a").first().attr("href").split("/")[2].split(".")[0],
                name: $(e).find("a").first().text().trim(),
                url: baseUrl + $(e).find("a").first().attr("href"),
            };
            listCategory.push(category);
        });
    }).then(() => {
        console.log(listCategory.length);
        fs.writeFile('./crawler/bookbuy/bookbuycategory.json', JSON.stringify(listCategory), (err) => {
            if (err) throw err;
        });
    });

    let listBook = [];
    let listBookPromises = [];

    for (const category of listCategory) {
        const bookPromise = await axios.get(category.url, config).then(async (res) => {
            const $ = cheerio.load(res.data);
            $(".product-item").each((i, e) => {
                const book = {
                    id: $(e).find(".img-view").attr("productid"),
                    title: $(e).find(".t-view").text().trim(),
                    url: baseUrl + $(e).find("a").attr("href"),
                    image: baseUrl + $(e).find(".slimmage").attr("src"),
                };

                for (const item of listBook)
                    if (item.id == book.id) return;
                listBook.push(book);
            });
        });
        listBookPromises.push(await timer(1000).then(() => bookPromise));
        console.log("[Category crawled] " + category.name);
    }

    Promise.all(listBookPromises).then(async () => {
        fs.writeFile('./crawler/bookbuy/bookbuynodata.json', JSON.stringify(listBook), (err) => {
            if (err) throw err.cause;
        });
        console.log(listBook.length);
        return listBook;
    });

    var bookPromises = [];
    for (const book of listBook) {
        try {
            const getBook = await axios.get(book.url, config).then((res) => {
                const $ = cheerio.load(res.data);
                book.author = $(".author-list").toArray().map((e) => $(e).find("h2").text().trim());
                book.translator = $(".tran-list").toArray().map((e) => $(e).find("h2").text().trim());
                $(".tag-span span").eq(0).remove();
                book.categories = $(".tag-span span").toArray().map((e) => {
                    try {
                        return {
                            code: $(e).find("a").attr("href").split("/")[2].split(".")[0],
                            name: $(e).find("a").text().trim(),
                        }
                    } catch (error) {
                        return {
                            name: $(e).find("a").text().trim(),
                        }
                    }
                });
                $(".des-des p").eq(-1).remove();
                book.info = $(".bbook-detail-left-1-1 ul li").toArray().map((e) => {
                    if ($(e).text().trim().includes("Ngày xuất bản")) {
                        const fullText = $(e).text().trim().replace(/\s+/g, ' ');
                        return {
                            field: fullText.split(":")[0].trim() + ':',
                            value: fullText.split(":")[1].trim(),
                        }
                    } else {
                        return {
                            field: $(e).first().contents().filter(function () {
                                return this.type === 'text';
                            }).text().trim().replace(/\s+/g, ' '),
                            value: $(e).children().text().trim().replace(/\s+/g, ' '),
                        }
                    }
                });
                book.description = $(".des-des").html().trim();
                console.log("[Book crawled] " + book.title);
            });
            bookPromises.push(await timer(1000).then(() => getBook));
            // bookPromises.push(getBook);
        } catch (error) {
            console.log(error);
        }
    }

    Promise.all(bookPromises).then(() => {
        fs.writeFile('./crawler/bookbuy/bookbuy.json', JSON.stringify(listBook), (err) => {
            console.log("Done");
        });
    });
}

async function test() {
    const url = "https://bookbuy.vn/sach/van-hoc-viet-nam";
    await fetch(url).then(async (res) => {
        const body = await res.text();
        console.log("Start list book");
        console.log(body);
    }).catch((err) => {
        console.log(err.cause);
    });
}

// const NovelList = await getNovel();
// const NovelList = await getContent();
// const NovelList = await getChapter();
const NovelList = await bookbuy();
// const NovelList = await test();
