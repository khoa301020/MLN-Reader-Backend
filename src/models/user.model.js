// create user model
import mongoose from "mongoose";
// import bcryptjs for password hashing
// import bcrypt from 'bcryptjs';
// import jwt for token generation
// import jwt from "jsonwebtoken";

// create user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
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
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
    followingNovels: [{
        novelId: {
            type: String,
            required: true,
        },
        followedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    }],
    followingMangas: [{
        mangaId: {
            type: String,
            required: true,
        },
        followedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    }],
    ratedNovels: [{
        novelId: {
            type: String,
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
    ratedMangas: [{
        mangaId: {
            type: String,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// create a method to generate token
// userSchema.methods.generateAuthToken = async function () {
//     const user = this;
//     const token = jwt.sign({ _id: user._id.toString() }, "secret");
//     user.tokens = user.tokens.concat({ token });
//     await user.save();
//     return token;
// };

const User = mongoose.model("User", userSchema);

export default User;
