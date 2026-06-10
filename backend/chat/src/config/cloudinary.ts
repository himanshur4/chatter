import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name:process.env.Cloud_Name as string,
    api_key:process.env.Api_Key as string,
    api_secret:process.env.Api_Secret as string,
});

export default cloudinary;