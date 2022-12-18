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
    userName: {
        type: String,
        required: true,
    },
    userAvatar: {
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

const TagSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        default: 'both',
        enum: ['novel', 'manga', 'both'],
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const Comment = mongoose.model('Comment', CommentSchema, 'comments');
const Tag = mongoose.model('Tag', TagSchema, 'tags');
const SystemStatus = mongoose.model('SystemStatus', systemStatusSchema, 'systemStatus');

export { SystemStatus, Comment, Tag };
