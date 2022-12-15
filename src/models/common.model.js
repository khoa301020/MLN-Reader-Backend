import mongoose from 'mongoose';

// create system status schema
const systemStatusSchema = new mongoose.Schema({
    lastUserId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastNovelId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastNovelSectionId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastNovelChapterId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastNovelNoteId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastMangaId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastMangaSectionId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastMangaChapterId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastCommentId: {
        type: Number,
        required: true,
        default: 0,
    },
});

const CommentSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    targetId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        required: false,
        default: null,
    },
    history: {
        _id: false,
        type: [{
            content: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                required: true,
                default: Date.now,
            },
            modifiedAt: {
                type: Date,
                required: true,
                default: Date.now,
            },
        }],
        required: false,
    },
});

const Comment = mongoose.model('Comment', CommentSchema, 'comments');

const SystemStatus = mongoose.model('SystemStatus', systemStatusSchema, 'systemStatus');

export { SystemStatus, Comment };
