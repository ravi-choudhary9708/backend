import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary= async (LocalFilePath)=>{
    try {
        if(!LocalFilePath) return null;
        //upload file on cloudinary
        const response= await cloudinary.uploader.upload(LocalFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
    //    console.log('file is uploaded on cloudinary',response.url);
       fs.unlinkSync(LocalFilePath) //remove the local file
        return response 
    } catch (error) {
        fs.unlinkSync(LocalFilePath) //remove the local file as upload failed
        return null 
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto" // or "video" if deleting a video
        });
        return response;
    } catch (error) {
        console.log("Error deleting from Cloudinary", error);
        return null;
    }
};





export  {uploadOnCloudinary,deleteFromCloudinary}