import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path: './env'
});

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`server started on ${process.env.PORT}`);
});

