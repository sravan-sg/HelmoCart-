const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const product = require("../models/productModel");

const { default: mongoose } = require("mongoose");
const User = require('../models/usermodels')

module.exports = {
  generateInvoice: asyncHandler(async (orderId) => {
    const order = await Order.findById(orderId).populate({ path: "products.product", model: "Product" }).populate("address");

   
console.log(order,"hiiii")

// const user = await User.findById(orders.user);

    const data = {
        content: [
            {
                text: "INVOICE",
                style: "header",
                alignment: "center",
                margin: [0, 0, 0, 20],
            },
            {
                columns: [
                    {
                        width: "*",
                        stack: [
                            { text: `Order Date: ${order.createdAt ? order.createdAt.toLocaleDateString() : 'N/A'}` },

                            
                        ],
                    },
                    {
                        width: "*",
                        stack: [
                            { text: `Delivered Date: ${order.deliveredDate ? order.deliveredDate.toLocaleDateString():'N/A'}` },


                            { text: `Order ID: ${order._id}` },
                        ],
                    },
                ],
            },
            {
                columns: [
                    {
                        width: "*",
                        text: [
                            { text: "Billing Address:", style: "subheader" },
                            {
                                text: [
                                    order.address.address,
                                    order.address.town,
                                    order.address.state,
                                    order.address.pincode,
                                    order.address.phone,
                                ].join("\n"),
                                style: "address",
                            },
                        ],
                    },
                    {
                        width: "*",


                        // text: [
                        //     { text: "Payment Information:", style: "subheader" },
                        //     `Payment Method: ${orders.payment_method}\nPayment Status: ${order.isPaid}\n
                        //     Wallet Payment: ₹${orders.wallet}`
                        //     ,
                        // ],



                        text: [
                            { text: "Payment Information:", style: "subheader" },
                            `Payment Method: ${order.paymentMethod}\nPayment Status: ${order.status}`
                           
                        ],
                    },
                ],
                margin: [0, 20, 0, 10],
            },
            { text: "Order Summary:", style: "subheader", margin: [0, 20, 0, 10] },
            {
                table: {
                    body: [
                        [
                            { text: "Product", style: "tableHeader" },
                            { text: "Quantity", style: "tableHeader" },
                            { text: "Price", style: "tableHeader" },
                        ],
                        ...order.products.map(product => [
                            product.product.title || "N/A",
                            product.quantity || "N/A",
                            { text: `₹${parseFloat(product.price || 0).toFixed(2)}`, alignment: "right" },
                        ]),
                        ["Subtotal", "", { text: `₹${parseFloat(order.grandTotal).toFixed(2)}`, alignment: "right" }],
                        ["Total", "", { text: `₹${parseFloat(order.grandTotal).toFixed(2)}`, alignment: "right" }],
                    ],
                },
            }
            
            ,
            
            { text: "Thank you for shopping with us!", style: "thankYou", alignment: "center", margin: [0, 20, 0, 0] },
        ],
        styles: {
            header: {
                fontSize: 24,
                bold: true,
                decoration: "underline",
            },
            subheader: {
                fontSize: 16,
                bold: true,
            },
            address: {
                fontSize: 14,
            },
            info: {
                fontSize: 14,
            },
            tableHeader: {
                fillColor: "#337ab7",
                color: "#ffffff",
                alignment: "center",
                bold: true,
            },
            tableCell: {
                fillColor: "#f2f2f2",
                alignment: "center",
            },
            thankYou: {
                fontSize: 16,
                italic: true,
                                                                      },
        },
    };

    return data;
}),


};