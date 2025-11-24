
"use server";

import { connectToDatabase } from "@/lib/database/connect";
import Category from "@/lib/database/models/category.model";
import slugify from "slugify";
import cloudinary from "cloudinary";
import { base64ToBuffer } from "@/utils";

// cloudinary configuration

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});


// create a category for vendor:

export const createCategory = async (name: string, images: string[]) => {
    try {

        await connectToDatabase();

        const testCategory = await Category.findOne({ name });

        if (testCategory) {
            return {
                message: "Category name already exists, try a different name.",
                success: false,
                categories: [],
            };
        }

        // upload images to cloudinary

        const uploadImagesToCloudinary = images.map(async (base64Images: any) => {
            const buffer = base64ToBuffer(base64Images);
            const formData = new FormData();

            formData.append("file", new Blob([buffer], { type: "image/jpeg" }));
            formData.append("upload_preset", "website");

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            return response.json();
        });

        const cloudinaryImages = await Promise.all(uploadImagesToCloudinary);
        const imageUrls = cloudinaryImages.map((img) => ({
            url: img.secure_url,
            public_id: img.public_id,
        }));

        await new Category({
            name,
            slug: slugify(name),
            images: imageUrls,
        }).save();

        const categories = (await Category.find()).sort({ updatedAt: -1 });

        return {
            success: true,
            message: `Category ${name} has been successfully created.`,
            categories: JSON.parse(JSON.stringify(categories)),
        };
        
    } catch (error: any) {
        console.log(error);
    }
};

// delete category for vendor

export const deleteCategory = async (id: string) => {
    try {
        
        await connectToDatabase();
        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return JSON.parse(
                JSON.stringify({
                    message: "Category mot found with this ID!",
                    success: false,
                })
            );
        }

        const imagePublicIds = category.images.map((image:any) => image.public_url);
        const deleteImagePromises = imagePublicIds.map((publicId:string) => cloudinary.v2.uploader.destroy(publicId));

        await Promise.all(deleteImagePromises);
        const categories = (await Category.find().sort({ updatedAt: -1 });
        
        return {
            success: true,
            message: "Successfully deleted Category and it&apos;s associated images in Category",
            categories: JSON.parse(JSON.stringify(categories)),
        }

    } catch (error: any) {
        console.log(error);
    }
};

// update category for vendor

export const updateCategory = async (id: string, name: string) => {
    try {

        await connectToDatabase();
        const category = await Category.findByIdAndUpdate(id, { name });
        if(!category) {
            return {
                message: "Category not found with this ID!",
                success: false,
            };
        }

        const categories = await Category.find().sort({ updatedAt: -1 });
        
        return {
            message: "Successfully updated product!",
            success: true,

            categories: JSON.parse(JSON.stringify(categories)),
        };

    } catch (error: any) {
        console.log(error);
    }
};

// get all categories for vendor

export const getAllCategories = async () => {
    try {

        await connectToDatabase();

        const categories = await Category.find().sort({ updatedAt: -1 });

        return JSON.parse(JSON.stringify(categories));

    } catch (error: any) {  
        console.log(error);
    }
};