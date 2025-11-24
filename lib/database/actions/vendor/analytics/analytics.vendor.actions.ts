"use server"

import Order from "@/lib/database/models/order.model";
import { generateLast12MonthsData } from "./analytics.generator";
import Product from "@/lib/database/models/product.model";
import { connectToDatabase } from "@/lib/database/connect";
import mongoose from "mongoose";
import { verify_vendor } from "@/utils";



// get order analytics for vendor
export const getOrderAnalytics = async () => {
    try {
        
        const orders = await generateLast12MonthsData(Order, "order");
        return { orders };

    } catch (error: any) {

        console.log(error);

    }
};

//get product analytics for vendor
export const getProductAnalytics = async () => {
    try {
        
        const products = await generateLast12MonthsData(Product, "product");
        return { products };

    } catch (error: any) {

        console.log(error);

    }
};

//get product size analytics for vendor
export const sizeAnalytics = async () => {

    try {
  
        await connectToDatabase();

        // verify_vendor was initiated at utils/index.tsx

        const vendor = await verify_vendor();
        
        const products = await Product.find({
            "vendor._id": vendor?.id
        });

        if (!products) {
            return {
                message: "Vendor ID is invalid",
                success: false,
            };
        }

        const individualSizeAnalytics = products.reduce((acc, product) => {
            product.subProducts.forEach((subProduct: any) => {
                subProduct.sizes.forEach((size: any) => {
                    if (acc[size.size]) {
                        acc[size.size] += size.sold; 
                    } else {
                        acc[size.size] = size.sold;
                    }
                });
            });
            return acc;
        });

        const sizeData = Object.keys(individualSizeAnalytics).map((size) => ({
                name: size,
                value: individualSizeAnalytics[size],
        }));

        return JSON.parse(JSON.stringify(sizeData));

    } catch (error: any) {

        console.log(error);

    }

};

// get top selling products for vendor
export const getTopSellingProducts = async () => {

};


