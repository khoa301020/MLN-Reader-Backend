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

export { User };
