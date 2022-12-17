import { Tag } from "../models/common.model.js";

export const GetTags = async (req, res) => {
    try {
        const tags = await Tag.find({}, { _id: 0, createdAt: 0, __v: 0 });
        res.success({ message: "Get all tags", result: tags });
    } catch (error) {
        res.error({ message: "Error occured", errors: error });
    }
}

export const TagAction = async (req, res) => {
    if (!req.body.action) return res.error({ message: "Action is required" });
    if (req.body.action === "create") {
        if (!req.body.name) return res.error({ message: "Name is required" });
        if (!req.body.code) return res.error({ message: "Code is required" });

        try {
            const tag = await Tag.create({
                name: req.body.name,
                code: req.body.code,
            });
            res.success({ message: "Create tag", result: tag });
        } catch (error) {
            res.error({ message: "Error occured", errors: error });
        }
    } else if (req.body.action === "update") {
        if (!req.body.name) return res.error({ message: "Name is required" });
        if (!req.body.code) return res.error({ message: "Code is required" });

        try {
            const tag = await Tag.findByIdAndUpdate(req.body.code, { name: req.body.name, code: req.body.code }, { new: true });
            res.success({ message: "Update tag", result: tag });
        } catch (error) {
            res.error({ message: "Error occured", errors: error });
        }
    } else if (req.body.action === "delete") {
        if (!req.body.code) return res.error({ message: "Code is required" });

        try {
            const tag = Tag.findOneAndDelete({ code: req.body.code });
            res.success({ message: "Delete tag", result: tag });
        } catch (error) {
            res.error({ message: "Error occured", errors: error });
        }
    } else {
        return res.error({ message: "Action is invalid" });
    }
}