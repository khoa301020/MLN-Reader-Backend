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
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  notes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NovelNote",
      required: true,
      default: [],
    },
  ],
  wordCount: {
    type: Number,
    required: true,
  },
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
      ref: "NovelChapter",
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
const novelSchema = new mongoose.Schema({
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
    ref: "NovelSection",
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

novelSchema.virtual("followersCount").get(function () {
  return this.followers?.length;
});

novelSchema.virtual("type").get(function () {
  return "novel";
});

novelSchema.virtual("lastChapter", {
  ref: "NovelChapter",
  localField: "id",
  foreignField: "novelId",
  match: { deletedAt: null },
  options: { sort: { createdAt: -1 } },
  justOne: true,
});

novelSchema.virtual("sectionCount", {
  ref: "NovelSection",
  localField: "id",
  foreignField: "novelId",
  options: {
    match: {
      deletedAt: null,
    },
  },
  count: true,
});

novelSchema.virtual("chapterCount", {
  ref: "NovelChapter",
  localField: "id",
  foreignField: "novelId",
  options: {
    match: {
      deletedAt: null,
    },
  },
  count: true,
});

novelSchema.virtual("uploaderInfo", {
  ref: "User",
  localField: "uploader",
  foreignField: "name",
  justOne: true,
});

novelChapterSchema.virtual("sectionInfo", {
  ref: "NovelSection",
  localField: "sectionId",
  foreignField: "id",
  justOne: true,
});

novelChapterSchema.virtual("novelInfo", {
  ref: "Novel",
  localField: "novelId",
  foreignField: "id",
  justOne: true,
});

novelChapterSchema.methods.setPrevNext = async function (id, novelId) {
  const novel = await mongoose
    .model("Novel")
    .findOne({ id: novelId })
    .select("sections")
    .populate({
      path: "sections",
      select: "chapters",
      options: {
        match: {
          deletedAt: null,
        },
      },
      populate: {
        path: "chapters",
        select: "-_id id",
        options: {
          match: {
            deletedAt: null,
          },
        },
      },
    })
    .lean();

  let allChapters = novel.sections.reduce((acc, obj) => {
    return acc.concat(obj.chapters);
  }, []);

  const index = allChapters.findIndex((item) => item.id === id);

  const nav = {
    prev: allChapters[index - 1]?.id,
    next: allChapters[index + 1]?.id,
  };

  return nav;
};

novelSchema.set("toJSON", { virtuals: true });
novelSectionSchema.set("toJSON", { virtuals: true });
novelChapterSchema.set("toJSON", { virtuals: true });

const Note = mongoose.model("NovelNote", novelNoteSchema, "novelNotes");
const Chapter = mongoose.model(
  "NovelChapter",
  novelChapterSchema,
  "novelChapters"
);
const Section = mongoose.model(
  "NovelSection",
  novelSectionSchema,
  "novelSections"
);
const Novel = mongoose.model("Novel", novelSchema, "novels");

export { Note, Chapter, Section, Novel };
