import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

const { default: connectDB } = await import("./db/index.js");
const { app } = await import("./app.js");

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.error("Express error:", error);
            throw error;
        });

        const port = process.env.PORT || 8000;

        app.listen(port, () => {
            console.log(`Server is running at port: ${port}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    });