import mongoose, {Schema} from "mongoose";
import jwt  from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new Schema (
    {
        username : {
            type : String,
            required: true,
            index: true,
            lowercase: true,
            unique: true,
            trim: true
        },
        email : {
            type : String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true
        },
        fullname : {
            type : String,
            required: true,
            index: true,
            trim: true
        },
        avatar : {
            type : String,
            required: true,
        },
        coverImage : {
            type : String
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password field can't be empty"]
        },
        refreshToken: {
            type: String
        }

    },

    {timestamps: true}
)

// Middleware: Hash the password before saving (pre-save hook)
userSchema.pre("save", async function (next) {
    try {
        if(this.isModified("password")) {
            this.password = await bcrypt.hash(this.password, 8);
            next();
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

// Method: Check if a given password is correct
userSchema.methods.isPasswordCorrect = async function (password)
{
   return await bcrypt.compare(password, this.password)
}

// Method: Generate an access token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// Method: Generate a refresh token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)