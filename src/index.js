import dotenv from "dotenv"
import dbConnect from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path: './.env'})

dbConnect()
.then(
    app.listen(process.env.PORT || 7000, () => {
        console.log(`Server is started and running at port : ${process.env.PORT}`)
    })
)
.catch((error) => {
    console.log("Error ecountered while connecting : ", error)
})

app.on("error" , (error) => {
    console.log("Error ecountered", error)
    throw error
})

/*
import express from "express"
const app = express()
;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("Error", (error) => {
            console.log("Error: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()
*/