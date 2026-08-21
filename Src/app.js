import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "25kb" }));
app.use(express.urlencoded({ extended: true, limit: "25kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
app.use("/api/v1/videos", videoRouter);
console.log("VIDEO ROUTER STACK:", videoRouter.stack.map(l => l.route?.path));
//routes declaration.
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);


 
//http://localhost:8000/api/v1/users/register
 
// ⭐ GLOBAL ERROR HANDLING MIDDLEWARE — ye missing tha
// Express middleware ko error handler banane ke liye 4 arguments (err, req, res, next) chahiye hote hain.
// Isko hamesha SABSE AAKHRI mein rakhna hai, sab routes ke baad.
app.use((err, req, res, next) => {
    console.log("\n========== GLOBAL ERROR HANDLER ==========");
    console.error(err);
    console.log("============================================\n");
 
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
 
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors: err.errors || [],
    });
});
 
export { app };