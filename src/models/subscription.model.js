import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId, // user subscribing to this subscription
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // channel getting subscried by the 'subscriber'
        ref: "User"
    }
}, {timestamps: true});

export const Subcription = mongoose.model('Subcription', subscriptionSchema);