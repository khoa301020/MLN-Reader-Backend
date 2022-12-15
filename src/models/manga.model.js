import mongoose from "mongoose";

// create chapter schema
const mangaChapterSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    mangaId: {
        type: String,
        required: true,
    },
    sectionId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    pages: [String],
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
const mangaSectionSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    mangaId: {
        type: String,
        required: true,
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
        ref: "MangaChapter",
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
const mangaSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
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
        default: "Đang cập nhật",
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
            userId: {
                type: String,
                required: true,
            },
            userName: {
                type: String,
                required: true,
            },
        },
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
            _id: false,
            type: [{
                date: {
                    type: String,
                    required: true,
                },
                views: {
                    type: Number,
                    required: true,
                    default: 0,
                },
            }],
            required: true,
            default: [],
        },
        monthlyView: {
            _id: false,
            type: [{
                month: {
                    type: String,
                    required: true,
                },
                views: {
                    type: Number,
                    required: true,
                    default: 0,
                },
            }],
            required: true,
            default: [],
        },
        yearlyView: {
            _id: false,
            type: [{
                year: {
                    type: String,
                    required: true,
                },
                views: {
                    type: Number,
                    required: true,
                    default: 0,
                },
            }],
            required: true,
            default: [],
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
mangaSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

mangaChapterSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

mangaSectionSchema.pre("find", function () {
    this.where({ deletedAt: null });
});

mangaSchema.virtual("followersCount").get(function () {
    return this.followers.length;
});

mangaSchema.virtual("ratingSum").get(function () {
    // return sum of rating
    let sum = 0;
    this.rating.forEach((rating) => {
        sum += rating.rating;
    });
    return sum;
});

// exclude fields

mangaSchema.set("toJSON", {
    virtuals: true, transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.deletedAt;
        delete ret.followers;
        delete ret.rating;
    }
});
mangaSectionSchema.set("toObject", { virtuals: true });
mangaSectionSchema.set("toJSON", {
    virtuals: true, transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.deletedAt;
    }
});
mangaChapterSchema.set("toObject", { virtuals: true });
mangaChapterSchema.set("toJSON", {
    virtuals: true, transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.deletedAt;
    }
});

const Manga = mongoose.model("Manga", mangaSchema, "mangas");
const Chapter = mongoose.model("MangaChapter", mangaChapterSchema, "mangaChapters");
const Section = mongoose.model("MangaSection", mangaSectionSchema, "mangaSections");

export { Manga, Chapter, Section };

