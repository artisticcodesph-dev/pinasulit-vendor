"use server";
import { connectToDatabase } from "@/lib/database/connect";
import { verify_vendor } from '@/utils';
import Order from "@/lib/database/models/order.model";
import Product from "@/lib/database/models/product.model";
import User from "@/lib/database/models/user.model";



//get dashboard data for vendor
export const getDashboardData = async () => {
    try {
        
        await connectToDatabase();
       
        // verify_vendor was configured at utils/index.ts
        const vendor = await verify_vendor();

        const orders = await Order.find({
            "products.vendor._id": vendor?.id,
        })
            .populate({ path: "user", model: User })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        
        const products = await Product.find({ "vendor._id": vendor?.id }).lean();

        return {
            orders: JSON.parse(JSON.stringify(orders)),
            products: JSON.parse(JSON.stringify(products)),
        };

    } catch (error: any) {
        console.log(error);
    }
};

// PRODUCTS:
// fetch low stock products for vendor

export const getLowStockProducts = async () => {
    
    try {
        
        await connectToDatabase();

        // verify_vendor was configured at utils/index.ts
        const vendor = await verify_vendor();

        const lowStockProducts = await Product.find(
            {
                "subProducts.size.qty": { $lte: 5 },
                "vendor._id": vendor?.id,
            },
            {
                name: 1,
                "subProducts.sizes.qty": 1,
                "subProducts.sizes.size": 1,
                "subProducts._id": 1,
            }
        );

        return {
            lowStockProducts: JSON.parse(JSON.stringify(lowStockProducts)),
        };

    } catch (error: any) {
        console.log(error);
    }

};

// fetch out of stock products for vendor

export const getOutOfStockProducts = async () => {
    try {

        await connectToDatabase();

        const vendor = await verify_vendor();

        const outOfStockProducts = await Product.find(
            {
                "subProducts.sizes.qty": { $eq: 0 },
                "vendor._id": vendor?.id,
            },
            {
                name: 1,
                "subProducts.sizes.qty": 1,
                "subProducts.size.size": 1,
                "subProducts._id": 1,
            }
        );

        return {
            outOfStockProducts: JSON.parse(JSON.stringify(outOfStockProducts)),
        };
        
    } catch (error: any) {
        console.log(error);
    }
};


//Orders
// Calculate today's orders, total orders, last week's orders and last month's orders

export const calculateTotalOrders = async () => {
    try {

        const getDayRange = (date: any) => {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            return { start, end };
        };

        await connectToDatabase();

        // verify_vendor was configured at utils/index.ts
        const vendor = await verify_vendor();

        const orders = await Order.find({
            "products.vendor._id": vendor?.id,
        });

        const now = new Date();
        const { start: startOfDay, end: endOfDay } = getDayRange(now);
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalSales = 0;
        let todaySales = 0;
        let lastWeekSales = 0;
        let lastMonthSales = 0;

        orders.forEach((order) => {
            totalSales = totalSales + order.total;
            if( order.createdAt >= startOfDay && order.createdAt <= endOfDay ){
                todaySales = todaySales + order.total;
            }

            if( order.createdAt >= startOfWeek ) {
                lastWeekSales = lastWeekSales + order.total;
            }

            if( order.createdAt >= startOfMonth ) {
                lastMonthSales = lastMonthSales + order.total;
            }
        });

        const growthPercentage = (todaySales / (totalSales - todaySales)) * 100;

        return {
            todaySales,
            totalSales,
            lastMonthSales,
            lastWeekSales,
            growthPercentage: growthPercentage.toFixed(2),
        };
    
    } catch (error: any) {
        console.log(error);
    }
};

// calculate new orders, pending orders, completed orders, cancelled orders

export const orderSummary = async () => {
    try {
        
        await connectToDatabase();

        // verify_vendor was configured at utils/index.ts
        const vendor = await verify_vendor();

        // count new order documents
        const newOrders = await Order.countDocuments({
            isNew: true,
            "products.vendor._id": vendor?.id,
        });

        const pendingOrders = await Order.countDocuments({
            "products.status": "Not Processed",
            "products.vendor._id": vendor?.id,
        });

        const completeOrders = await Order.countDocuments({
            "products.status": "Completed",
            "products.vendor._id": vendor?.id,
        });

        const cancelledOrders = await Order.countDocuments({
            "products.status": "Cancelled",
            "products.vendor._id": vendor?.id,
        });

        return {
            newOrders,
            pendingOrders,
            completeOrders,
            cancelledOrders
        };

    } catch (error: any) {
        console.log(error);
    }
};