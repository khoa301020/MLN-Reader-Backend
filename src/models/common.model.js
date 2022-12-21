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
    type: {
        type: String,
        required: true,
        enum: ['novel', 'novel-chapter', 'manga', 'manga-chapter'],
    },
    path: {
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

CommentSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: 'id',
    justOne: true,
});

CommentSchema.virtual('target', {
    ref: function () {
        if (this.type === 'novel') {
            return 'Novel';
        } else if (this.type === 'novel-chapter') {
            return 'NovelChapter';
        } else if (this.type === 'manga') {
            return 'Manga';
        } else if (this.type === 'manga-chapter') {
            return 'MangaChapter';
        }
    },
    localField: 'targetId',
    foreignField: 'id',
    justOne: true,
});

CommentSchema.pre('save', function (next) {
    // add id to Novel/Manga/NovelChapter/MangaChapter
    if (!this.isNew) {
        return next();
    }
    if (this.type === 'novel') {
        mongoose.model('Novel').findOneAndUpdate({ id: this.targetId }, { $push: { comments: this._id } }, { new: true }).exec();
    } else if (this.type === 'novel-chapter') {
        mongoose.model('NovelChapter').findOneAndUpdate({ id: this.targetId }, { $push: { comments: this._id } }, { new: true }).exec();
    } else if (this.type === 'manga') {
        mongoose.model('Manga').findOneAndUpdate({ id: this.targetId }, { $push: { comments: this._id } }, { new: true }).exec();
    } else if (this.type === 'manga-chapter') {
        mongoose.model('MangaChapter').findOneAndUpdate({ id: this.targetId }, { $push: { comments: this._id } }, { new: true }).exec();
    }
    next();
});

CommentSchema.set('toObject', { virtuals: true });
CommentSchema.set('toJSON', { virtuals: true });

const Comment = mongoose.model('Comment', CommentSchema, 'comments');
const Tag = mongoose.model('Tag', TagSchema, 'tags');
const SystemStatus = mongoose.model('SystemStatus', systemStatusSchema, 'systemStatus');

export { SystemStatus, Comment, Tag };
