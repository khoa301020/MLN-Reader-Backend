import mongoose from "mongoose";

// create manga schema
const mangaSchema = new mongoose.Schema({
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
            chapterNumber: {
                type: Number,
                required: true,
            },
            pages: [
                {
                    pageNumber: {
                        type: Number,
                        required: true,
                    },
                    image: {
                        type: String,
                        required: true,
                    },
                },
            ],
        },
    ],
});

const Manga = mongoose.model("Manga", mangaSchema);

export default Manga;
