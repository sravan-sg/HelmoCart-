const category = require('../models/categoryModel')
const expressHandler = require('express-async-handler')


// category page-- 
const categoryManagement = expressHandler(async (req, res) => {
    try {
        const findCategory = await category.find()
        res.render('./admin/pages/categories', { catList: findCategory, title: 'Categories' })
    } catch (error) {
        throw new Error(error)
    }
})

// addCategory form---
const addCategory = expressHandler(async (req, res) => {
    try {
        const findCategory = await category.find();
    
        res.render('./admin/pages/addCategory', {catList:findCategory, title: 'addCategory' })
    } catch (error) {
        throw new Error(error)
    }
})

// inserting  categories--
const insertCategory = expressHandler(async (req, res) => {
    try {

        const categoryName = req.body.addCategory;
       
        
        const regexCategoryName = new RegExp(`^${categoryName}$`, 'i'); 
        const findCat = await category.findOne({ categoryName: regexCategoryName });

        if (findCat) {
            const catCheck = `Category ${categoryName} Already existing`;
            res.render('./admin/pages/addCategory', { catCheck, title: 'addCategory' });
        } else {
            const result = new category({
                categoryName: categoryName,
            });
            await result.save();

            // res.redirect('./admin/pages/categories', {
            //     message: `Category ${categoryName} added successfully`,
            //     title: 'addCategory',
            // });
            res.redirect('/admin/category')
        }

    } catch (error) {
        throw new Error(error);
    }
});


// list category--
const list = expressHandler(async (req, res) => {
    try {

        const id = req.params.id
        console.log(id);

        const listing = await category.findByIdAndUpdate({ _id: id }, { $set: { isListed: true } })
        console.log(listing);
        res.redirect('/admin/category')

    } catch (error) {
        throw new Error(error)
    }
})

// unlist category---
const unList = expressHandler(async (req, res) => {
    try {
        const id = req.params.id
        console.log(id);
       
        const listing = await category.findByIdAndUpdate({ _id: id }, { $set: { isListed: false } })
        console.log(listing);
        res.redirect('/admin/category')

    } catch (error) {
        throw new Error(error)
    }

})

// edit Category form --
const editCategory = expressHandler(async (req, res) => {

    try {
        const { id } = req.params
        const catCheck = await category.findById(id);
        if (catCheck) {
            res.render('./admin/pages/editCategory', { title: 'editCategory',catCheck });
        } else {
            console.log('error in rendering');
        }
    } catch (error) {
        throw new Error(error)
    }
})

// update Category name --
const updateCategory = expressHandler(async (req, res) => {
    try {
        const id = req.params.id;
        const updatedName = req.body.updatedName.trim();

        if (!updatedName) {
            res.render('./admin/pages/editCategory', { catCheck: { message: 'Please provide a category name' }, title: 'Edit Category' });
            return;
        }

        // Check if the updated name already exists in other documents
        const categoryExists = await category.findOne({
            _id: { $ne: id },
            categoryName: new RegExp(`^${updatedName}$`, 'i')
        });

        if (categoryExists) {
            const catCheck = { message: `Category ${updatedName} already exists.`, updatedName };
            res.render('./admin/pages/editCategory', { catCheck, title: 'Edit Category' });
        } else {
            await category.findByIdAndUpdate(id, { categoryName: updatedName });
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while updating the category.");
    }
});


// searchcCategory----
const searchCategory = expressHandler(async (req, res) => {
    console.log(req.body.search);
    try {
        const data = req.body.search
        const searching = await category.find({ categoryName: { $regex: data, $options: 'i' } });
        if (searching) {
            res.render('./admin/pages/categories', { title: 'Searching', catList: searching })

        } else {
            res.render('./admin/pages/categories', { title: 'Searching' })
        }

    } catch (error) {
        throw new Error(error)
    }
})


module.exports = {
    categoryManagement,
    addCategory,
    insertCategory,
    list,
    unList,
    editCategory,
    updateCategory,
    searchCategory

}