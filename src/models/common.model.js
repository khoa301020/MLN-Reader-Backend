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
});

const SystemStatus = mongoose.model('SystemStatus', systemStatusSchema, 'systemStatus');

export default SystemStatus;