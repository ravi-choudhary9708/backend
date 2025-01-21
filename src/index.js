import dotenv from "dotenv"

import mongoose from "mongoose";

import connectdb from "./db/index.js";
dotenv.config({
  path:"./env"
})

connectdb().then(()=>{
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`server is running at port : ${process.env.PORT}  `);
    
  })
}).catch((err)=>{
  console.log('mongodb connection fail',err);
  
})
/*
( async ()=>{
 try {
   await mongoose.connect(`${process.env.local.MONGODB_URI}/{DB_NAME}`)
 } catch (error) {
    console.log('error',error);
    
 }
})()
*/