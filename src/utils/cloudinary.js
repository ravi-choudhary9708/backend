import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";


 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.cloud_name, 
    api_key: process.env.api_key, 
    api_secret: process.env.api_secret // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary= async (LocalFilePath)=>{
    try {
        if(!LocalFilePath) return null;
        //upload file on cloudinary
        const response= await cloudinary.uploader.upload(LocalFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log('file is uploaded on cloudinary',response.url);
        return response 
    } catch (error) {
        fs.unlinkSync(LocalFilePath) //remove the local file
        return null 
    }
}


// Upload an image
const uploadResult = await cloudinary.uploader
.upload(
    'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
        public_id: 'shoes',
    }
)
.catch((error) => {
    console.log(error);
});



console.log(uploadResult);

export const {uploadOnCloudinary}