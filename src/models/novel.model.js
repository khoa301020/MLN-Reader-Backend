import mongoose from "mongoose";

// create note schema
const novelNoteSchema = new mongoose.Schema({
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
const novelChapterSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    novelId: {
        type: String,
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
    hakoUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    notes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "NovelNote",
        required: true,
        default: [],
    }],
    wordCount: {
        type: Number,
        required: true,
    },
    viewCount: {
        type: Number,
        required: true,
        default: 0,
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
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

// create section schema
const novelSectionSchema = new mongoose.Schema({
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
        ref: "NovelChapter",
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
        required: false,
    },
    hakoUrl: {
        type: String,
        required: false,
    },
    title: {
        type: String,
        required: true,
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
        type: String,
        required: true,
    },

    tags: {
        _id: false,
        type: [{
            code: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
        }],
        required: true,
    },

    followers: {
        _id: false,
        type: [{
            userId: {
                type: Number,
                required: true,
            },
            followedAt: {
                type: Date,
                required: true,
                default: Date.now,
            },
        }],
        required: false,
        default: [],
    },

    rating: {
        _id: false,
        type: [{
            userId: {
                type: Number,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
            },
            ratedAt: {
                type: Date,
                required: true,
                default: Date.now,
            },
        }],
        required: false,
        default: [],
    },

    sections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "NovelSection",
        required: true,
        default: [],
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        required: true,
        default: [],
    }],
    statistics: {
        _id: false,
        totalView: {
            type: Number,
            required: true,
            default: 0,
        },
        dailyView: {
            type: Object,
            required: false,
            default: {},
        },
        monthlyView: {
            type: Object,
            required: false,
            default: {},
        },
        yearlyView: {
            type: Object,
            required: false,
            default: {},
        },
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

// filter deletedAt
novelSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

novelChapterSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

novelSectionSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

novelNoteSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

novelSchema.virtual("followersCount").get(function () {
    return this.followers.length;
});

novelSchema.virtual("ratingSum").get(function () {
    // return sum of rating
    let sum = 0;
    this.rating.forEach((rating) => {
        sum += rating.rating;
    });
    return sum;
});

// exclude fields
novelNoteSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        delete returnedObject._id;
        delete returnedObject.hakoId;
        delete returnedObject.__v;
        delete returnedObject.deletedAt;
    },
});

novelSchema.set("toJSON", {
    virtuals: true, transform(doc, ret) {
        delete ret._id;
        delete ret.hakoId;
        delete ret.__v;
        delete ret.deletedAt;
        delete ret.followers;
        delete ret.rating;
    }
});
novelSectionSchema.set("toObject", { virtuals: true });
novelSectionSchema.set("toJSON", {
    virtuals: true, transform(doc, ret) {
        delete ret._id;
        delete ret.hakoId;
        delete ret.__v;
        delete ret.deletedAt;
    }
});
novelChapterSchema.set("toObject", { virtuals: true });
novelChapterSchema.set("toJSON", {
    virtuals: true, transform(doc, ret) {
        delete ret._id;
        delete ret.hakoId;
        delete ret.__v;
        delete ret.deletedAt;
    }
});

const Note = mongoose.model("NovelNote", novelNoteSchema, "novelNotes");
const Chapter = mongoose.model("NovelChapter", novelChapterSchema, "novelChapters");
const Section = mongoose.model("NovelSection", novelSectionSchema, "novelSections");
const Novel = mongoose.model("Novel", novelSchema, "novels");

export { Note, Chapter, Section, Novel };

