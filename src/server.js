import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
// import routes
import authRoutes from "./routes/auth.route.js";
import mangaRoutes from "./routes/manga.route.js";

// init
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// middlewares
app.use(express.json());
app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));

// connect to mongodb
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, () =>
    console.log("Connected to db!")
);

// routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.get("/up-chapter", (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use("/api/auth", authRoutes);
app.use("/api/manga", mangaRoutes);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
