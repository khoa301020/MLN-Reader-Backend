import _const from "../constants/const.js";
import { Comment, SystemStatus } from "../models/common.model.js";

const CommentAction = (req, res) => {
    if (!req.body.targetId) return res.error({ message: "Target ID is required" });
    if (!req.body.userId) return res.error({ message: "User ID is required" });
    if (!req.body.content) return res.error({ message: "Content is required" });
    if (!req.body.action) return res.error({ message: "Action is required" });
    if (!_const.COMMENT_ACTIONS.includes(req.body.action)) return res.error({ message: "Invalid action" });

    const { targetId, userId, content, action } = req.body;
    const prefix = "comment_"

    if (action === "create") {
        SystemStatus.findOne({}).exec(function (err, SystemStatus) {
            if (err) return res.error(err);
            if (!SystemStatus) return res.error({ message: "System status not found" });

            SystemStatus.lastCommentId += 1;

            const newComment = new Comment({
                id: prefix + SystemStatus.lastCommentId,
                targetId,
                userId,
                content,
            });

            newComment.save(function (err) {
                if (err) return res.error(err);
                SystemStatus.save(function (err) {
                    if (err) return res.error(err);
                    return res.created({ message: "Comment created", result: newComment });
                });
            });
        });
    } else if (action === "modify") {
        if (!req.body.commentId) return res.error({ message: "Comment ID is required" });
        const { commentId } = req.body;

        Comment.findOne({ id: commentId }).exec(function (err, comment) {
            if (err) return res.error(err);
            if (!comment) return res.error({ message: "Comment not found" });
            if (comment.userId !== userId) return res.error({ message: "You are not the owner of this comment" });

            const oldComment = comment.content;
            const oldCommentTimestamp = comment.updatedAt;

            comment.content = content;
            comment.history.push({ content: oldComment, modifiedAt: oldCommentTimestamp });
            comment.updatedAt = Date.now();

            comment.markModified("history");
            comment.markModified("content");
            comment.markModified("updatedAt");

            comment.save(function (err) {
                if (err) return res.error(err);
                return res.success({ message: "Comment modified", result: comment });
            });
        });
    } else if (action === "delete") {
        if (!req.body.commentId) return res.error({ message: "Comment ID is required" });
        const { commentId } = req.body;

        Comment.findOne({ id: commentId }).exec(function (err, comment) {
            if (err) return res.error(err);
            if (!comment) return res.error({ message: "Comment not found" });
            if (comment.userId !== userId) return res.error({ message: "You are not the owner of this comment" });

            comment.deletedAt = Date.now();
            comment.save(function (err) {
                if (err) return res.error(err);
                return res.success({ message: "Comment deleted", result: comment });
            });
        });
    }
}

export { CommentAction };
