import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

const dbConnect = async () =>  {
    try{
        const connectionInst = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n mongo connected!!, DB host: ${connectionInst.connection.host}`)
    } catch (error){
        console.log("Error while connecting", error);
        process.exit(1);
    }
}

export default dbConnect