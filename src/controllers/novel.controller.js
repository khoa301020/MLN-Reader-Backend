import _const from "../constants/const.js";
import * as Helper from "../helper/helper.js";
import { Chapter, Note, Novel, NovelStatus, Section } from "../models/novel.model.js";

const GetNovelList = async (req, res) => {
    // get only novels that are not deleted
    Novel.find({}).exec((err, novels) => {
        if (err) return res.error({ message: "Get novels failed", errors: err });

        res.success({ message: "Get novels successfully", result: novels });
    });
};

const GetNovel = (req, res) => {
    if (!req.query.novelId) return res.error({ message: "Novel id is required" });

    Novel.findOne({ id: req.query.novelId })
        .populate({
            path: 'sections',
            populate: { path: 'chapters', select: '-content -notes -url -wordCount' }
        }).exec((err, novel) => {
            if (err) return res.error({ message: "Get novel failed", errors: err });
            if (!novel) return res.error({ message: "Novel not found" });

            res.success({ message: "Get novel successfully", result: novel });
        });
};

const GetChapter = (req, res) => {
    if (!req.query.chapterId) return res.error({ message: "Chapter id is required" });

    Chapter.findOne({ id: req.query.chapterId }, { '_id': 0, '__v': 0 })
        .populate({
            path: 'notes', select: '-_id -__v -deletedAt', match: { deletedAt: null },
        }).exec((err, chapter) => {
            if (err) return res.error({ message: "Get chapter failed", errors: err });
            if (!chapter) return res.error({ message: "Chapter not found" });

            res.success({ message: "Get chapter successfully", result: chapter });
        });
};

const CreateAction = (req, res) => {
    if (!req.body.subject) return res.error({ message: "Subject is required" });
    if (!_const.NOVEL_SUBJECT.includes(req.body.subject)) return res.error({ message: "Subject is invalid" });

    let parentName, ParentModel, parentIdProperty, lastIdProperty, entity, prefix;

    switch (req.body.subject) {
        case 'novel':
            lastIdProperty = "lastNovelId";
            entity = new Novel({
                hakoId: req.body.hakoId,
                info: req.body.info,
            });
            break;
        case 'section':
            parentName = "novel";
            ParentModel = Novel;
            parentIdProperty = "novelId";
            lastIdProperty = "lastSectionId";
            entity = new Section({
                novelId: req.body.novelId,
                hakoId: req.body.hakoId,
                cover: req.body.cover,
                name: req.body.name,
            });
            prefix = "volume_";
            break;
        case 'chapter':
            parentName = "section";
            ParentModel = Section;
            parentIdProperty = "sectionId";
            lastIdProperty = "lastChapterId";
            entity = new Chapter({
                sectionId: req.body.sectionId,
                hakoId: req.body.hakoId,
                title: req.body.title,
                url: req.body.url,
                content: req.body.content,
                wordCount: req.body.wordCount,
                lastUpdate: req.body.lastUpdate,
            });
            prefix = "c";
            break;
        case 'note':
            parentName = "chapter";
            ParentModel = Chapter;
            parentIdProperty = "chapterId";
            lastIdProperty = "lastNoteId";
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

    NovelStatus.findOne({}).exec(function (err, novelStatus) {
        if (err) return res.internal({ message: "Error occurred", errors: err });
        if (!novelStatus) return res.error({ message: "Novel status not found" });
        if (!ParentModel) {

            novelStatus[lastIdProperty] += 1;

            const target = entity;
            target.id = novelStatus[lastIdProperty];

            target.save((err) => {
                if (err) return res.error({ message: `Create ${req.body.subject} failed`, errors: err });
                novelStatus.save((err) => {
                    if (err) return res(err);
                    res.created({ message: `${Helper.capitalizeFirstLetter(req.body.subject)} ${req.body.hakoId} created!`, result: target });
                });
            });
        } else {
            ParentModel.findOne({ id: req.body[parentIdProperty], }).populate(`${req.body.subject}s`, "id").exec(function (err, parent) {
                if (err) return res.internal({ message: "Error occurred", errors: err });
                if (!parent) return res.error({ message: `${Helper.capitalizeFirstLetter(parentName)} not found` });

                novelStatus[lastIdProperty] += 1;

                const target = entity;
                target.id = prefix + novelStatus[lastIdProperty];

                if (!parent[`${req.body.subject}s`]) return res.internal({ message: `${Helper.capitalizeFirstLetter(parentName)} ${req.body.subject}s not found` });
                parent[`${req.body.subject}s`].push(target._id);

                target.save((err) => {
                    if (err) return res.error({ message: `Create ${req.body.subject} failed`, errors: err });
                    parent.save((err) => {
                        if (err) return res.error({ message: `Add ${req.body.subject} to ${parentName} failed`, errors: err });
                        novelStatus.save((err) => {
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
    if (!req.body.subject) return res.error({ message: "Subject is required" });
    if (!_const.NOVEL_SUBJECT.includes(req.body.subject)) return res.error({ message: "Subject is invalid" });

    let Model, data;

    switch (req.body.subject) {
        case 'novel':
            Model = Novel;
            data = {
                info: {
                    title: req.body.info.title,
                    cover: req.body.info.cover,
                    author: req.body.info.author,
                    artist: req.body.info.artist,
                    status: req.body.info.status,
                    otherNames: req.body.info.otherNames,
                    description: req.body.info.description,
                    uploader: req.body.info.uploader,
                    tags: req.body.info.tags,
                }
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
    if (!_const.NOVEL_SUBJECT.includes(req.body.type)) return res.error({ message: "Invalid type" });
    if (!req.body.action) return res.error({ message: "Action is required" });
    if (!_const.DELETE_ACTION.includes(req.body.action)) return res.error({ message: "Invalid action" });
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

export { GetNovelList, GetNovel, GetChapter, CreateAction, UpdateAction, DeleteAction };

