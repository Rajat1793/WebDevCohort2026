import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String, // data type
        trim: true,
        minlength: 3,
        maxlength: 50,
        required: [true, "Name is required"] // custom error message
    },
    email: {
        type: String, // data type
        trim: true,
        unique: true, // unique index
        required: [true, "Email is required"],
        lowercase: true // custom error message
    },
    password: {
        type: String, // data type
        trim: true,
        minlength: 6,
        required: [true, "Password is required"], // custom error message
        select: false // do not return this field in queries by default
    },
    role:{
        type: String,
        enum: ["user", "admin", "seller"], // allowed values
        default: "user" // default value
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        select: false // do not return this field in queries by default
    },
    refreshToken: {
        type: String,
        select: false // do not return this field in queries by default
    },
    resetPasswordToken: {
        type: String,
        select: false // do not return this field in queries by default
    },
    resetPasswordExpires: {
        type: Date,
        select: false // do not return this field in queries by default
    }
}, {timestamps: true }) // automatically add createdAt and updatedAt fields

export default mongoose.model("User", userSchema)