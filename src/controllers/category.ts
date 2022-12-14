import { Response, Request, NextFunction } from 'express'
import Category from '../models/category'
import Album from '../models/album'
import { body, validationResult } from 'express-validator'

// Display list of all categories
export const category_list = async (
    _: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const categories = await Category.find({}, 'name description').sort({
            name: 1,
        })
        res.render('category_list', {
            title: 'All Categories',
            cat_list: categories,
        })
    } catch (err) {
        next(err)
    }
}

// Display detail page for a specific category.
export const category_detail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const category = await Category.findById(req.params.id)
        res.render('category_info', {
            category,
        })
    } catch (err) {
        next(err)
    }
}

// Display category create form on GET.
export const category_create_get = async (_: Request, res: Response) => {
    res.render('category_form', { title: 'Create Category' })
}

// Handle category create on POST.
export const category_create_post = [
    // Validate and santize the name field
    body('name', 'Category name required').trim().isLength({ min: 3 }).escape(),
    body('description', 'Category description required')
        .trim()
        .isLength({ min: 10 })
        .escape(),
    async (req: Request, res: Response, next: NextFunction) => {
        // Get the validation errors from the request
        const errors = validationResult(req)
        const category = new Category({
            name: req.body.name,
            description: req.body.description,
        })

        if (!errors.isEmpty()) {
            // If there are errors, render with form filled
            res.render('category_form', {
                title: 'Create Category',
                category,
                errors: errors.array(),
            })
            return
        } else {
            try {
                const foundCategory = await Category.findOne({
                    name: req.body.name,
                })
                if (foundCategory != null) res.redirect(foundCategory.url)
                await category.save()
                res.redirect(category.url)
            } catch (err) {
                return next(err)
            }
        }
    },
]

// Display category delete form on GET.
export const category_delete_get = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await Promise.all([
            Category.findById(req.params.id),
            Album.find({ category: req.params.id }),
        ])

        const [category, albums] = result

        // If the category name is null, we know that
        // the category didn't exist, so redirect.
        if (category == null) {
            res.redirect('/store/categories')
        }

        res.render('category_delete', {
            title: `Delete ${result[0]?.name}?`,
            category,
            albums,
        })
    } catch (err) {
        return next(err)
    }
}

// Handle category delete on POST.
export const category_delete_post = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await Promise.all([
            Category.findById(req.params.id),
            Album.find({ category: req.params.id }),
        ])

        const [category, albums] = result

        // If category has associated albums,
        // render in same way as GET
        if (albums.length > 0) {
            res.render('category_delete', {
                title: `Delete ${result[0]?.name}?`,
                category,
                albums,
            })
        }

        // If there are no albums, delete the category as
        // requested
        await Category.findByIdAndDelete(req.body.categoryid)
        res.redirect('/store/categories')
    } catch (err) {
        next(err)
    }
}

// Display category update form on GET.
export const category_update_get = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const category = await Category.findById(req.params.id)

        if (category == null) {
            throw new Error('Category not found')
        }

        res.render('category_form', {
            title: 'Update Category',
            category,
        })
    } catch (err) {
        next(err)
    }
}

// Handle category update on POST.
export const category_update_post = [
    // Validate and santize the name field
    body('name', 'Category name required').trim().isLength({ min: 3 }).escape(),
    body('description', 'Category description required')
        .trim()
        .isLength({ min: 10 })
        .escape(),
    async (req: Request, res: Response, next: NextFunction) => {
        // Get the validation errors from the request
        const errors = validationResult(req)
        const category = new Category({
            name: req.body.name,
            description: req.body.description,
            _id: req.params.id,
        })

        if (errors.isEmpty()) {
            try {
                const updatedCategory = await Category.findByIdAndUpdate(
                    req.params.id,
                    category,
                    {}
                ).exec()
                if (updatedCategory) {
                    res.redirect(updatedCategory.url)
                }
            } catch (err) {
                next(err)
            }
        } else {
            try {
                res.render('category_form', {
                    title: 'Update Category',
                    category,
                    errors: errors.array(),
                })
            } catch (err) {
                next(err)
            }
        }
    },
]
