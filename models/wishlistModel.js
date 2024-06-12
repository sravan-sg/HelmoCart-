const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',   
        },
    
         productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', 
                required:true,
            },
           
       
        total:{type : Number}
}, {
    timestamps: true
});

// Export the model
module.exports = mongoose.model("wishlist", wishlistSchema)