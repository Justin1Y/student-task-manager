const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        account: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
