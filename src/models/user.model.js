// create user model
import mongoose from "mongoose";
// import bcryptjs for password hashing
import bcrypt from "bcryptjs";
// import jwt for token generation
import jwt from "jsonwebtoken";

// create user schema
const userSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    avatar: {
        type: String,
        required: false,
        trim: true,
        default: process.env.DEFAULT_AVATAR,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    accountStatus: {
        status: {
            type: String,
            required: true,
            trim: true,
            default: "active",
            enum: ["active", "disabled"],
        },
        reason: {
            type: String,
            required: false,
            trim: true,
            default: null,
        },
        disabledAt: {
            type: Date,
            required: false,
            default: null,
        },
    },

    role: {
        type: String,
        required: true,
        trim: true,
        default: "user",
        enum: ["user", "admin"],
    },
    token: {
        type: String,
        required: false,
        default: null,
    },

    uploaded: {
        novel: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Novel",
            required: true,
            default: [],
        },
        manga: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Manga",
            required: true,
            default: [],
        },
    },

    chapterUploaded: {
        novel: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "NovelChapter",
            required: true,
            default: [],
        },
        manga: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "MangaChapter",
            required: true,
            default: [],
        },
    },

    following: {
        novel: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Novel",
            required: true,
            default: [],
        },
        manga: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Manga",
            required: true,
            default: [],
        },
    },

    rated: {
        novel: [
            {
                _id: false,
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Novel",
                    required: true,
                },
                rating: {
                    type: Number,
                    required: true,
                    default: 0,
                },
            },
        ],
        manga: [
            {
                _id: false,
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Manga",
                    required: true,
                },
                rating: {
                    type: Number,
                    required: true,
                    default: 0,
                },
            },
        ],
    },

    history: {
        novel: [
            {
                _id: false,
                novelId: String,
                novelTitle: String,
                novelCover: String,
                chapterId: String,
                chapterTitle: String,
                lastRead: Date,
            },
        ],
        manga: [
            {
                _id: false,
                mangaId: String,
                mangaTitle: String,
                mangaCover: String,
                chapterId: String,
                chapterTitle: String,
                lastRead: Date,
            },
        ],
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.virtual("uploadedNovels", {
    ref: "Novel",
    localField: "name",
    foreignField: "uploader",
    options: {
        select: "id title cover status createdAt updatedAt deletedAt",
        match: {
            deletedAt: null,
        },
    },
});

userSchema.virtual("uploadedMangas", {
    ref: "Manga",
    localField: "name",
    foreignField: "uploader",
    options: {
        select: "id title cover status createdAt updatedAt deletedAt",
        match: {
            deletedAt: null,
        },
    },
});

userSchema.virtual("uploadedNovelChapters", {
    ref: "NovelChapter",
    localField: "name",
    foreignField: "creator",
    options: { match: { deletedAt: null } },
    count: true,
});

userSchema.virtual("uploadedMangaChapters", {
    ref: "MangaChapter",
    localField: "name",
    foreignField: "creator",
    options: { match: { deletedAt: null } },
    count: true,
});

userSchema.pre("save", async function (next) {
    try {
        if (this.isNew) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(this.password, salt);
            this.password = hashedPassword;
        }
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
};

userSchema.methods.generateToken = async function () {
    try {
        const token = jwt.sign(
            { id: this.id, name: this.name, role: this.role },
            process.env.JWT_SECRET,
            { expiresIn: "30 days" }
        );
        this.token = token;
        await this.save();
        return token;
    } catch (error) {
        throw error;
    }
};

userSchema.methods.verifyToken = async function (token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await this.model("User").findOne({
            id: decoded.id,
            token,
        });
        if (user) {
            return user;
        }
        throw new Error("User not found");
    } catch (error) {
        throw error;
    }
};

userSchema.set("toJSON", { virtuals: true });

const User = mongoose.model("User", userSchema);

export default User;
