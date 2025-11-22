import mongoose from "mongoose";

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const vendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        email: {
            type: String,
            require: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        description: {
            type: String,
        },

        address: {
            type: String,
            required: true,
        },

        phoneNumber: {
            type: Number,
            require: true,
        },

        role: {
            type: String,
            default: "vendor",
        },

        zipCode: {
            type: Number,
            required: true,
        },

        availableBalance: {
            type: Number,
            default: 0,
        },

        createdAt: {
            type: Date,
            default: Date.now(),
        },

        commission: {
            type: Number,
        },

        verified: {
            type: Boolean,
            default: false,
        },
    }
);

//signing jwt to the vendor
vendorSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

// comparing the password for vendor

vendorSchema.methods.comparePassword = async function(enteredPassword = String) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);

export default Vendor;