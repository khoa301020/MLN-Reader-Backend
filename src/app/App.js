import cors from "cors";
import express from "express";
import helmet from 'helmet';
import morgan from "morgan";
// import routes
import authRoutes from "../routes/auth.route.js";
import commonRoutes from "../routes/common.route.js";
import mangaRoutes from "../routes/manga.route.js";
import novelRoutes from "../routes/novel.route.js";
// import middlewares
import customResponse from "../middlewares/customResponse.js";
import requestTime from "../middlewares/requestTime.js";

// init
const app = express();


// middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({ credentials: true, origin: 'https://mln-reader.et.r.appspot.com' }));
app.use(helmet());
app.use(morgan("dev"));
app.use(requestTime);
app.use(customResponse);

// routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.use("/api/auth", authRoutes);
app.use("/api/manga", mangaRoutes);
app.use("/api/novel", novelRoutes);
app.use("/api/common", commonRoutes);

export default app;