import "dotenv/config";
import express from "express";
import mongoose, { ConnectOptions } from "mongoose";
import morgan from "morgan";
// import routes

// init
const app = express();

// middlewares
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: false }));

// connect to mongodb
mongoose.connect(
    process.env.MONGO_URI!,
    {
        useNewUrlParser: true,
    } as ConnectOptions,
    () => console.log("Connected to db!")
);

// routes
app.get("/", (req, res) => {
    return res.send("Hello World");
});

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
