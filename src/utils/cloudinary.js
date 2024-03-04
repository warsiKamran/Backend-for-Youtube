import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async(filePath) => {

    try{
        if(!filePath) return null;

        //upload on cloudinary
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        });

        //file has been uploaded
        // console.log("file has been uploaded", response.url);

        fs.unlinkSync(filePath);
        return response;
    } 
    catch (error){
        fs.unlinkSync(filePath)   //removes the locally uploaded saved files
        return null;
    }
};

export {uploadOnCloudinary};

