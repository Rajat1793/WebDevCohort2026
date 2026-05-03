import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/common/config/db.js";

const  PORT = process.env.PORT || 3000;
const start = async () => {
    // connect to db
    await connectDB
    app.listen(PORT, () =>{
        console.log(`Server os running at ${PORT} in ${process.env.NODE_ENV} mode`);
    })
}

start().catch((err) => {
    console.log("Error starting the server", err);
    process.exit(1);
});
