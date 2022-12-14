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
  pages: [
    {
      type: {
        _id: false,
        pageNumber: {
          type: Number,
          required: true,
        },
        pageUrl: {
          type: String,
          required: true,
        },
      },
      required: true,
      default: [],
    },
  ],
  viewCount: {
    type: Number,
    required: true,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: true,
      default: [],
    },
  ],
  creator: {
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
  chapters: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MangaChapter",
      required: true,
      default: [],
    },
  ],
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
    default: "??ang c???p nh???t",
  },
  artist: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: true,
    default: "??ang ti???n h??nh",
    enum: ["??ang ti???n h??nh", "???? ho??n th??nh", "T???m ng??ng"],
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

  followers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    required: true,
    default: [],
  },

  sections: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "MangaSection",
    required: true,
    default: [],
  },

  comments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Comment",
    required: true,
    default: [],
  },

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
  return this.followers?.length;
});

mangaSchema.virtual("type").get(function () {
  return "manga";
});

mangaSchema.virtual("lastChapter", {
  ref: "MangaChapter",
  localField: "id",
  foreignField: "mangaId",
  justOne: true,
  match: { deletedAt: null },
});

mangaSchema.virtual("chapterCount", {
  ref: "MangaChapter",
  localField: "id",
  foreignField: "mangaId",
  count: true,
});

// mangaSchema.virtual("ratingSum").get(function () {
//     // return sum of rating
//     let sum = 0;
//     this.rating?.forEach((rating) => {
//         sum += rating.rating;
//     });
//     return sum;
// });

mangaSchema.virtual("uploaderInfo", {
  ref: "User",
  localField: "uploader",
  foreignField: "name",
  justOne: true,
});

mangaChapterSchema.virtual("sectionInfo", {
  ref: "MangaSection",
  localField: "sectionId",
  foreignField: "id",
  justOne: true,
});

// exclude fields

mangaSchema.set("toJSON", { virtuals: true });
mangaSectionSchema.set("toJSON", { virtuals: true });
mangaChapterSchema.set("toJSON", { virtuals: true });

const Manga = mongoose.model("Manga", mangaSchema, "mangas");
const Chapter = mongoose.model(
  "MangaChapter",
  mangaChapterSchema,
  "mangaChapters"
);
const Section = mongoose.model(
  "MangaSection",
  mangaSectionSchema,
  "mangaSections"
);

export { Manga, Chapter, Section };
