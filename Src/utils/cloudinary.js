import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log("CLOUDINARY CONFIG CHECK:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? "PRESENT" : "MISSING",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "PRESENT" : "MISSING",
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// TEMPORARY CONNECTION TEST
cloudinary.api
    .ping()
    .then((result) => {
        console.log("✅ CLOUDINARY PING SUCCESS:", result);
    })
    .catch((error) => {
        console.log("\n========== CLOUDINARY PING ERROR ==========");
        console.dir(error, { depth: null });
        console.log("===========================================\n");
    });

const removeLocalFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const uploadOnCloudinary = async (localFilePath) => {
    console.log("🔥 CLOUDINARY FUNCTION CALLED");

    try {
        if (!localFilePath) {
            console.log("❌ No local file path received");
            return null;
        }

        console.log("📁 FILE PATH RECEIVED:", localFilePath);
        console.log("🚀 STARTING CLOUDINARY UPLOAD...");

        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
            }
        );

        console.log("✅ CLOUDINARY SUCCESS:", response.secure_url);

        removeLocalFile(localFilePath);

        return response;
    } catch (error) {
        console.log("\n========== CLOUDINARY UPLOAD ERROR ==========");
        console.log("MESSAGE:", error.message);
        console.log("HTTP CODE:", error.http_code);
        console.log("NAME:", error.name);
        console.dir(error, { depth: null });
        console.log("=============================================\n");

        removeLocalFile(localFilePath);

        return null;
    }
};

export { uploadOnCloudinary };