import mongoose from "mongoose";

// create novel status schema
const novelStatusSchema = new mongoose.Schema({
    lastNovelId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastSectionId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastChapterId: {
        type: Number,
        required: true,
        default: 0,
    },
    lastNoteId: {
        type: Number,
        required: true,
        default: 0,
    },
});

// create note schema
const noteSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    chapterId: {
        type: String,
        required: true,
    },
    hakoId: {
        type: String,
        unique: true,
        required: false,
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
    lastUpdate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        required: false,
        default: null,
    },
});


// create chapter schema
const chapterSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    sectionId: {
        type: String,
        required: true,
    },
    hakoId: {
        type: String,
        unique: true,
        required: false,
    },
    title: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
        required: true,
        default: [],
    }],
    wordCount: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    lastUpdate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        required: false,
        default: null,
    },
});

// create section schema
const sectionSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    novelId: {
        type: String,
        required: true,
    },
    hakoId: {
        type: String,
        unique: true,
        required: false,
    },
    cover: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    chapters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
        required: true,
        default: [],
    }],
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    lastUpdate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        required: false,
        default: null,
    },
});

// create novel schema
const novelSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },

    hakoId: {
        type: String,
        unique: true,
        required: false,
    },

    info: {
        title: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: false,
        },
        cover: {
            type: String,
            required: true,
            default: "https://docln.net/img/nocover.jpg",
        },
        author: {
            type: String,
            required: true,
        },
        artist: {
            type: String,
            required: false,
        },
        status: {
            type: String,
            required: true,
            default: "Đang tiến hành",
            enum: ["Đang tiến hành", "Đã hoàn thành", "Tạm ngưng"],
        },
        otherNames: {
            type: [String],
            required: false,
        },
        description: {
            type: String,
            required: true,
        },
        uploader: {
            _id: false,
            type: {
                id: {
                    type: String,
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
            },
            required: true,
        },
        tags: {
            _id: false,
            type: [
                {
                    code: {
                        type: String,
                        required: true,
                    },
                    name: {
                        type: String,
                        required: true,
                    },
                },
            ],
            required: true,
        },
        followCount: {
            type: Number,
            required: false,
            default: 0,
        },
        wordCount: {
            type: Number,
            required: false,
            default: 0,
        },
        viewCount: {
            type: Number,
            required: false,
            default: 0,
        },
        ratingCount: {
            type: Number,
            required: false,
            default: 0,
        },
        lastUpdate: {
            type: Date,
            required: false,
            default: Date.now,
        },
        createdAt: {
            type: Date,
            required: false,
            default: Date.now,
        },
    },

    sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
        required: true,
        default: [],
    }],
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    lastUpdate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
        required: false,
        default: null,
    },
});

novelSchema.set("toJSON", { virtuals: true });
chapterSchema.set("toJSON", { virtuals: true });
sectionSchema.set("toJSON", { virtuals: true });
noteSchema.set("toJSON", { virtuals: true });

// exclude deletedAt field

novelSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

chapterSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

sectionSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

noteSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

// exclude _id and __v and deletedAt field

novelSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        delete returnedObject._id;
        delete returnedObject.hakoId;
        delete returnedObject.__v;
        delete returnedObject.deletedAt;
    },
});

chapterSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        delete returnedObject._id;
        delete returnedObject.hakoId;
        delete returnedObject.__v;
        delete returnedObject.deletedAt;
    },
});

sectionSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        delete returnedObject._id;
        delete returnedObject.hakoId;
        delete returnedObject.__v;
        delete returnedObject.deletedAt;
    },
});

noteSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        delete returnedObject._id;
        delete returnedObject.hakoId;
        delete returnedObject.__v;
        delete returnedObject.deletedAt;
    },
});

const NovelStatus = mongoose.model("NovelStatus", novelStatusSchema, "novelStatus");
const Note = mongoose.model("Note", noteSchema, "novelNotes");
const Chapter = mongoose.model("Chapter", chapterSchema, "novelChapters");
const Section = mongoose.model("Section", sectionSchema, "novelSections");
const Novel = mongoose.model("Novel", novelSchema, "novels");

export { NovelStatus, Note, Chapter, Section, Novel };

