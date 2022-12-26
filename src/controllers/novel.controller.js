import path from 'path';
import _const from "../constants/const.js";
import * as Helper from "../helper/helper.js";
import bucket from '../libs/GCP-Storage.js';
import { SystemStatus } from "../models/common.model.js";
import { Chapter, Note, Novel, Section } from "../models/novel.model.js";
import User from "../models/user.model.js";

const GetNovelList = async (req, res) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const sort = req.query.sort;

    const select = "id title cover description rating followers statistics";

    Novel.find({}).select(select).sort(_const.QUERY_SORT[sort]).skip((page - 1) * limit).limit(limit).exec((err, novels) => {
        if (err) return res.error({ message: "Get novel list failed", errors: err });
        res.success({ message: "Get novel list successfully", result: novels });
    });
};

const GetNovel = (req, res) => {
    if (!req.query.novelId) return res.error({ message: "Novel id is required" });

    let find;
    if (req.query.isOnly === 'true') {
        find = Novel.findOne({ id: req.query.novelId }).select('id title otherNames author artist status tags cover description');
    } else {
        find = Novel.findOne({ id: req.query.novelId })
            .populate("uploaderInfo", "-_id id name avatar")
            .populate({
                path: "comments", select: "-_id id userId content createdAt",
                populate: { path: "user", select: "-_id id name avatar" }
            })
            .populate({
                path: 'sections',
                populate: { path: 'chapters', select: '-content -notes -hakoUrl' }
            });
    }

    find.exec((err, novel) => {
        if (err) return res.error({ message: "Get novel failed", errors: err });
        if (!novel) return res.error({ message: "Novel not found" });

        res.success({ message: "Get novel successfully", result: novel });
    });
};

const GetNovelUpdate = (req, res) => {
    if (!req.query.novelId) return res.error({ message: "Novel id is required" });
    Novel.findOne({ id: req.query.novelId }).select('id title')
        .populate({
            path: 'sections', select: 'id name',
            populate: { path: 'chapters', select: 'id title' }
        }).exec((err, novel) => {
            if (err) return res.error({ message: "Get novel failed", errors: err });
            if (!novel) return res.error({ message: "Novel not found" });

            let novelUpdate = {
                id: novel.id,
                title: novel.title,
                type: 'novel',
                key: '0-0',
                children: []
            };

            novel.sections.forEach((section, sectionIndex) => {
                let sectionUpdate = {
                    id: section.id,
                    title: section.name,
                    type: 'novel-section',
                    key: `0-0-${sectionIndex}`,
                    children: []
                };

                section.chapters.forEach((chapter, chapterIndex) => {
                    let chapterUpdate = {
                        id: chapter.id,
                        type: 'novel-chapter',
                        title: chapter.title,
                        key: `0-0-${sectionIndex}-${chapterIndex}`
                    };

                    sectionUpdate.children.push(chapterUpdate);
                });

                novelUpdate.children.push(sectionUpdate);
            });

            res.success({ message: "Get novel successfully", result: novelUpdate });
        });
};

const GetSection = (req, res) => {
    if (!req.query.sectionId) return res.error({ message: "Section id is required" });

    Section.findOne({ id: req.query.sectionId }).select('id name cover').exec((err, section) => {
        if (err) return res.error({ message: "Get section failed", errors: err });
        if (!section) return res.error({ message: "Section not found" });

        res.success({ message: "Get section successfully", result: section });
    });
};

const GetChapter = (req, res) => {
    if (!req.query.chapterId) return res.error({ message: "Chapter id is required" });

    Chapter.findOne({ id: req.query.chapterId })
        .populate("sectionInfo", "-_id id name cover")
        .populate({
            path: "comments", select: "-_id id userId content createdAt",
            populate: { path: "user", select: "-_id id name avatar" }
        })
        .populate({
            path: "comments", select: "-_id id userId content createdAt",
            populate: { path: "user", select: "-_id id name avatar" }
        })
        .populate({ path: 'notes' }).exec(async (err, chapter) => {
            if (err) return res.error({ message: "Get chapter failed", errors: err });
            if (!chapter) return res.error({ message: "Chapter not found" });

            const sectionTitle = Section.findOne({ id: chapter.sectionId }).select('name').exec((err, section) => { return section.name; });

            if (req.query.isOnly === 'true') {
                chapter = {
                    id: chapter.id,
                    title: chapter.title,
                    content: chapter.content,
                    sectionTitle: sectionTitle,
                    notes: chapter.notes
                };

                res.success({ message: "Get chapter successfully", result: chapter });
            } else {

                Chapter.updateOne({ id: chapter.id }, { $inc: { 'statistics.totalView': 1 } }).exec((err, chapterUpdate) => {
                    if (err) console.log(err);
                    if (err) return res.error({ message: "Get chapter failed", errors: err });
                });

                Novel.findOne({ id: chapter.novelId }).exec((err, novel) => {
                    if (err) console.log(err);

                    const current = Helper.getCurrent();

                    if (novel) {
                        novel.statistics.totalView += 1;
                        novel.statistics.dailyView[`${current.currentDate}`] ?
                            novel.statistics.dailyView[`${current.currentDate}`] += 1 :
                            novel.statistics.dailyView[`${current.currentDate}`] = 1;
                        novel.statistics.monthlyView[`${current.currentMonth}`] ?
                            novel.statistics.monthlyView[`${current.currentMonth}`] += 1 :
                            novel.statistics.monthlyView[`${current.currentMonth}`] = 1;
                        novel.statistics.yearlyView[`${current.currentYear}`] ?
                            novel.statistics.yearlyView[`${current.currentYear}`] += 1 :
                            novel.statistics.yearlyView[`${current.currentYear}`] = 1;
                    }

                    novel.markModified('statistics');

                    novel.save((err, novelSave) => {
                        if (err) console.log(err);
                    });

                    res.success({
                        message: "Get chapter successfully",
                        result: {
                            chapter: chapter,
                            novelTitle: novel.title,
                            novelCover: novel.cover,
                            sectionTitle: sectionTitle,
                        }
                    });
                });

            }
        });
};

const CreateAction = (req, res) => {
    console.log(req.body);
    if (!req.body.subject) return res.error({ message: "Subject is required" });
    if (!_const.NOVEL_SUBJECTS.includes(req.body.subject)) return res.error({ message: "Subject is invalid" });

    let parentName, ParentModel, parentIdProperty, lastIdProperty, entity, prefix;

    console.log(req.body.tags);

    switch (req.body.subject) {
        case 'novel':
            lastIdProperty = "lastNovelId";
            entity = new Novel({
                hakoId: req.body.hakoId,
                hakoUrl: req.body.hakoUrl,
                title: req.body.title,
                cover: req.body.cover,
                author: req.body.author,
                artist: req.body.artist,
                status: req.body.status,
                otherNames: req.body.otherNames ? JSON.parse(req.body.otherNames) : [],
                description: req.body.description,
                uploader: req.body.uploader,
                tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            });
            prefix = "novel_";
            break;
        case 'section':
            parentName = "novel";
            ParentModel = Novel;
            parentIdProperty = "novelId";
            lastIdProperty = "lastNovelSectionId";
            entity = new Section({
                novelId: req.body.novelId,
                hakoId: req.body.hakoId,
                cover: req.body.cover,
                name: req.body.name,
            });
            prefix = "volume_n";
            break;
        case 'chapter':
            parentName = "section";
            ParentModel = Section;
            parentIdProperty = "sectionId";
            lastIdProperty = "lastNovelChapterId";
            entity = new Chapter({
                novelId: req.body.novelId,
                sectionId: req.body.sectionId,
                hakoId: req.body.hakoId,
                hakoUrl: req.body.hakoUrl,
                title: req.body.title,
                content: req.body.content,
                wordCount: req.body.wordCount,
            });
            prefix = "chapter_n";
            break;
        case 'note':
            parentName = "chapter";
            ParentModel = Chapter;
            parentIdProperty = "chapterId";
            lastIdProperty = "lastNovelNoteId";
            entity = new Note({
                chapterId: req.body.chapterId,
                hakoId: req.body.hakoId,
                content: req.body.content,
            });
            prefix = "note";
            break;
        default:
            return res.error({ message: "Subject is invalid" });
    }

    SystemStatus.findOne({}).exec(function (err, SystemStatus) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!SystemStatus) return res.error({ message: "System status not found" });
        if (!ParentModel) {
            SystemStatus[lastIdProperty] += 1;

            const target = entity;
            target.id = prefix + SystemStatus[lastIdProperty];

            if (req.file) {
                const filePath = `novel/${target.id}/cover${path.extname(req.file.originalname)}`
                bucket.file(filePath)
                    .save(req.file.buffer, {
                        metadata: {
                            contentType: req.file.mimetype,
                            cacheControl: 'private',
                        },
                    }, (err) => {
                        if (err) return console.log(err);
                    });
                target.cover = process.env.GCP_STORAGE_URL + filePath;
            } else {
                target.cover = process.env.HAKO_DEFAULT_COVER;
            }

            target.save((err) => {
                if (err) return res.error({ message: `Create ${req.body.subject} failed`, errors: err });
                SystemStatus.save((err) => {
                    if (err) return res(err);
                    res.created({ message: `${Helper.capitalizeFirstLetter(req.body.subject)} ${target.id} created!`, result: target });
                });
            });
        } else {
            ParentModel.findOne({ id: req.body[parentIdProperty], }).populate(`${req.body.subject}s`, "id").exec(function (err, parent) {
                if (err) return res.internal({ message: "Error occurred", errors: err });
                if (!parent) return res.error({ message: `${Helper.capitalizeFirstLetter(parentName)} not found` });

                SystemStatus[lastIdProperty] += 1;

                const target = entity;
                target.id = prefix + SystemStatus[lastIdProperty];

                if (req.file && req.body.subject === "section") {
                    const filePath = `novel/${parent.id}/${target.id}/cover${path.extname(req.file.originalname)}`

                    bucket.file(filePath)
                        .save(req.file.buffer, {
                            metadata: {
                                contentType: req.file.mimetype,
                            },
                        }, (err) => {
                            if (err) return console.log(err);
                        });
                    target.cover = process.env.GCP_STORAGE_URL + filePath;
                } else {
                    target.cover = process.env.HAKO_DEFAULT_COVER;
                }

                if (!parent[`${req.body.subject}s`]) return res.internal({ message: `${Helper.capitalizeFirstLetter(parentName)} ${req.body.subject}s not found` });
                parent[`${req.body.subject}s`].push(target._id);

                target.save((err) => {
                    if (err) return res.error({ message: `Create ${req.body.subject} failed`, errors: err });
                    parent.save((err) => {
                        if (err) return res.error({ message: `Add ${req.body.subject} to ${parentName} failed`, errors: err });
                        SystemStatus.save((err) => {
                            if (err) return res.error({ message: "Update novel status failed", errors: err });
                            res.created({ message: `${Helper.capitalizeFirstLetter(req.body.subject)} ${target.id} created!`, result: target });
                        });
                    });
                });
            });
        }
    })
};

const UpdateAction = (req, res) => {
    console.log(req.body);
    if (!req.body.subject) return res.error({ message: "Subject is required" });
    if (!_const.NOVEL_SUBJECTS.includes(req.body.subject)) return res.error({ message: "Subject is invalid" });

    let Model, data;

    switch (req.body.subject) {
        case 'novel':
            Model = Novel;
            data = {
                title: req.body.title,
                author: req.body.author,
                artist: req.body.artist,
                status: req.body.status,
                otherNames: req.body.otherNames ? JSON.parse(req.body.otherNames) : [],
                description: req.body.description,
                tags: req.body.tags ? JSON.parse(req.body.tags) : [],
            };
            break;
        case 'section':
            Model = Section;
            data = {
                cover: req.body.cover,
                name: req.body.name,
            };
            break;
        case 'chapter':
            Model = Chapter;
            data = {
                title: req.body.title,
                content: req.body.content,
                wordCount: req.body.wordCount,
            };
            break;
        case 'note':
            Model = Note;
            data = {
                content: req.body.content,
            };
            break;
        default:
            return res.error({ message: "Subject is invalid" });
    }

    Model.findOne({ id: req.body.id }).exec(function (err, target) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!target) return res.error({ message: `${Helper.capitalizeFirstLetter(req.body.subject)} not found` });

        let subjectPath;
        if (req.body.subject === 'novel')
            subjectPath = `${target.id}/`
        else if (req.body.subject === 'section')
            subjectPath = `${target.novelId}/${target.id}_`;

        if (req.file) {
            const filePath = `novel/${subjectPath}cover${path.extname(req.file.originalname)}`
            bucket.file(filePath)
                .save(req.file.buffer, {
                    metadata: {
                        contentType: req.file.mimetype,
                        cacheControl: 'private',
                    },
                }, (err) => {
                    if (err) return console.log(err);
                });
            target.cover = process.env.GCP_STORAGE_URL + filePath;
        }

        for (let key in data) {
            if (data[key]) target[key] = data[key];
        }

        target.save((err) => {
            if (err) return res.error({ message: `Update ${req.body.subject} failed`, errors: err });
            res.success({ message: `${Helper.capitalizeFirstLetter(req.body.subject)} ${req.body.id} updated!`, result: target });
        });
    });
};

const DeleteAction = (req, res) => {
    if (!req.body.type) return res.error({ message: "Type is required" });
    if (!_const.NOVEL_SUBJECTS.includes(req.body.type)) return res.error({ message: "Invalid type" });
    if (!req.body.action) return res.error({ message: "Action is required" });
    if (!_const.DELETE_ACTIONS.includes(req.body.action)) return res.error({ message: "Invalid action" });
    if (!req.body.id) return res.error({ message: "ID is required" });

    let Model;

    switch (req.body.type) {
        case "novel":
            Model = Novel;
            break;
        case "section":
            Model = Section;
            break;
        case "chapter":
            Model = Chapter;
            break;
        case "note":
            Model = Note;
            break;
        default:
            return res.error({ message: "Invalid type" });
    }

    Model.findOne({ id: req.body.id, }).exec(function (err, model) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!model) return res.error({ message: `${Helper.capitalizeFirstLetter(req.body.type)} not found` });

        if (req.body.action === "delete") {
            model.deletedAt = new Date();
            model.save((err) => {
                if (err) return res.error({ message: "Delete failed", errors: err });
                res.updated({ message: `${Helper.capitalizeFirstLetter(req.body.type)} ${req.body.id} deleted!` });
            });
        } else if (req.body.action === "restore") {
            model.deletedAt = null;
            model.save((err) => {
                if (err) return res.error({ message: "Restore failed", errors: err });
                res.updated({ message: `${Helper.capitalizeFirstLetter(req.body.type)} ${req.body.id} restored!` });
            });
        } else {
            return res.error({ message: "Invalid action" });
        }
    });
};

const FollowAction = (req, res) => {
    if (!req.body.userId) return res.error({ message: "ID is required" });
    if (!req.body.novelId) return res.error({ message: "Novel ID is required" });
    if (!req.body.action) return res.error({ message: "Action is required" });
    if (!_const.FOLLOW_ACTIONS.includes(req.body.action)) return res.error({ message: "Invalid action" });

    User.findOne({ id: req.body.userId }).exec(function (err, user) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!user) return res.error({ message: "User not found" });

        Novel.findOne({ id: req.body.novelId }).exec(function (err, novel) {
            if (err) return res.internal({ message: "Error occurred", errors: err });
            if (!novel) return res.error({ message: "Novel not found" });

            if (user.followingNovels.includes(novel.id)) {
                if (req.body.action === "unfollow") {
                    const novelToRemove = user.followingNovels.find(item => item.novelId === novel.id);
                    const novelIndex = user.followingNovels.indexOf(novelToRemove);
                    user.followingNovels.splice(itemIndex, 1);

                    const userToRemove = novel.followers.find(item => item.userId === user.id);
                    const userIndex = novel.followers.indexOf(userToRemove);
                    novel.followers.splice(userIndex, 1);

                    user.save((err) => {
                        if (err) return res.error({ message: "Unfollow failed", errors: err });
                        novel.save((err) => {
                            if (err) return res.error({ message: "Unfollow failed", errors: err });
                            res.success({ message: "Unfollowed" });
                        });
                    });
                }
            } else {
                if (req.body.action === "follow") {
                    user.followingNovels.push({ novelId: novel.id });
                    novel.followers.push({ userId: user.id });
                }
            }
        });
    });
};

const AddHistory = (req, res) => {
    if (!req.body.username) return res.error({ message: "Username is required" });
    if (!req.body.novelId) return res.error({ message: "Novel ID is required" });
    if (!req.body.chapterId) return res.error({ message: "Chapter ID is required" });

    User.findOne({ name: req.body.username }).exec(function (err, user) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!user) return res.error({ message: "User not found" });

        const newHistory = {
            novelId: req.body.novelId,
            novelTitle: req.body.novelTitle,
            novelCover: req.body.novelCover,
            chapterId: req.body.chapterId,
            chapterTitle: req.body.chapterTitle,
            lastRead: Date.now(),
        }

        let checkExist = false;

        // Check if novel is already in history
        for (let history of user.history.novel) {
            if (history.novelId === req.body.novelId) {
                checkExist = true;
                // Only update chapter if it's different
                if (history.chapterId !== req.body.chapterId) {
                    history.chapterId = req.body.chapterId;
                    history.chapterTitle = req.body.chapterTitle;
                } else {
                    return res.success({ message: "History already exists" });
                }
            }
        };

        if (!checkExist) {
            user.history.novel.push(newHistory);
        }

        user.markModified("history");

        user.save((err) => {
            if (err) return res.error({ message: "Add history failed", errors: err });
            res.success({ message: "History added" });
        });
    });
};

const GetHistory = (req, res) => {
    if (!req.query.username) return res.error({ message: "Username is required" });

    User.findOne({ name: req.query.username }).exec(function (err, user) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!user) return res.error({ message: "User not found" });

        res.success({ message: "History found", result: user.history.novel.slice(0, 10) });
    });
};

export { GetNovelList, GetNovel, GetChapter, CreateAction, UpdateAction, DeleteAction, FollowAction, AddHistory, GetHistory, GetNovelUpdate, GetSection };

