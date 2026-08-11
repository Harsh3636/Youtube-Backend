import {v2 as cloudinary} from "cloudinary"
import fs from "fs"





    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret:  process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    });
        
    const uploadOnCloudinary = async (localFilepath) => {
        try {
            if (!localFilepath) return null
            //upload the file on cloudinary.
            const response = await  cloudinary.uploader.upload(localFilepath, {
                resource_type: "auto"
            })
                //file has been uploaded succesfully.
            console.log("File is uploaded on cloudinary.", response.url);
            return response

        } catch (error) {
            fs.unlinkSync(localFilepath) // remove krega locaaly saved temporary files ko from the server as the upload operation got failed. 
            return null;
        }
    }

export {uploadOnCloudinary}
