import mongoose from "mongoose";

// create manga schema
const mangaSchema = new mongoose.Schema({
    id: {
        type: String,
        index: true,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    cover: {
        type: String,
        trim: true,
    },
    chapters: [
        {
            chapterOrder: {
                type: Number,
                index: true,
                required: true,
                // unique: true,
                trim: true,
            },
            chapterTitle: {
                type: String,
                required: true,
                trim: true,
            },
            pages: [
                {
                    pageNumber: {
                        type: String,
                        required: true,
                    },
                    image: {
                        type: String,
                        required: true,

                    },
                },
            ],
            uploadAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
});

const Manga = mongoose.model("Manga", mangaSchema);

export default Manga;
