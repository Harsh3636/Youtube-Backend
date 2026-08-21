import ImageKit from "imagekit";
import fs from "fs";

console.log("IMAGEKIT CONFIG CHECK:", {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY ? "PRESENT" : "MISSING",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? "PRESENT" : "MISSING",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const removeLocalFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const uploadOnImageKit = async (localFilePath) => {
    console.log("🔥 IMAGEKIT FUNCTION CALLED");

    try {
        if (!localFilePath) {
            console.log("❌ No local file path received");
            return null;
        }

        console.log("📁 FILE PATH RECEIVED:", localFilePath);
        console.log("🚀 STARTING IMAGEKIT UPLOAD...");

        const fileBuffer = fs.readFileSync(localFilePath);
        const fileName = localFilePath.split(/[\\/]/).pop();

        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: fileName,
        });

        console.log("✅ IMAGEKIT SUCCESS:", response.url);

        removeLocalFile(localFilePath);

        return response;
    } catch (error) {
        console.log("\n========== IMAGEKIT UPLOAD ERROR ==========");
        console.log("MESSAGE:", error.message);
        console.dir(error, { depth: null });
        console.log("=============================================\n");

        removeLocalFile(localFilePath);

        return null;
    }
};

const deleteFromImageKit = async (fileId) => {
    try {
        if (!fileId) {
            console.log("❌ No fileId received for deletion");
            return null;
        }

        const response = await imagekit.deleteFile(fileId);
        console.log("✅ IMAGEKIT FILE DELETED:", fileId);
        return response;
    } catch (error) {
        console.log("\n========== IMAGEKIT DELETE ERROR ==========");
        console.log("MESSAGE:", error.message);
        console.dir(error, { depth: null });
        console.log("=============================================\n");
        return null;
    }
};

export { uploadOnImageKit, deleteFromImageKit };