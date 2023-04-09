const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const fs = require("fs");

const { ProductModel } = require("../models");
const { ProductSizeModel } = require('../models');
const { ProductIngredientTypeModel } = require('../models');
const { ProductIngredientModel } = require('../models');

exports.findBySlug = async slug => {
    const product = await ProductModel.findOne({
        where: { slug },
        include: [
            {
                model: ProductSizeModel,
                as: 'sizes'
            },
            {
                model: ProductIngredientTypeModel,
                as: 'ingredientTypes'
            },
            {
                model: ProductIngredientModel,
                as: 'ingredients'
            }
        ],
    });
    
    return product;
};

exports.findAll = async (
    limit = -1,
    page = 1,
    columnSort = "id",
    directionSort = "asc",
    search = "",
    priceFilter,
    productNotFilterSlug
) => {
    const options = {
        ...((columnSort && directionSort) && {
                order: columnSort !== "random"
                        ? [[columnSort, directionSort]]
                        : Sequelize.literal("rand()")
            }),
        limit,
        offset: limit * (page - 1),
        where: {
            // name: {
            //     [Op.like]: "%" + search + "%"
            // },
            // ...(priceFilter && {
            //     price: {
            //         [Op.between]: [priceFilter[0] - 0.01, priceFilter[1]]
            //     }
            // }),
            // ...(productNotFilterSlug && {
            //     slug: {
            //         [Op.not]: productNotFilterSlug
            //     }
            // })
        },
        include: [
            {
                model: ProductSizeModel,
                as: 'sizes'
            },
            {
                model: ProductIngredientTypeModel,
                as: 'ingredientTypes'
            },
            {
                model: ProductIngredientModel,
                as: 'ingredients'
            }
        ]
    };

    const products = await ProductModel.findAll(options);
    const totalRows = await ProductModel.count();
    // const minPrice = await ProductModel.min("price");
    // const maxPrice = await ProductModel.max("price");
    return {
        totalRows,
        products,
        minPrice: 0,
        maxPrice: 0
    };
};

exports.findAllByIds = async (ids) => {
    console.log(ids);
    const products = await ProductModel.findAll({
        where: {
            id: {
                [Op.in]: ids
            },
        },
        include: [
            {
                model: ProductSizeModel,
                as: 'sizes'
            },
            {
                model: ProductIngredientTypeModel,
                as: 'ingredientTypes'
            },
            {
                model: ProductIngredientModel,
                as: 'ingredients'
            }
        ],
    });
    
    return products;
};

exports.create = async (
    name,
    description,
    slug,
    sizes,
    ingredientTypes,
    ingredients,
    photos
) => {
    if ((!photos.length || photos.length < 1) && !Array.isArray(photos)) {
        let arrayAuxPhotos = [];
        arrayAuxPhotos.push(photos);
        photos = arrayAuxPhotos;
    }

    let newPhotos = [];

    const uploadPath = __dirname + "/../public/img/product/";
    for (const photo of photos) {
        await new Promise(resolve => {
            const imageName = uuidv4() + path.extname(photo.name);
            const imagePath = uploadPath + imageName;

            photo.mv(imagePath, async error => {
                if (error) throw error;
                else {
                    const cloudinaryResponse = await cloudinary.uploader.upload(
                        imagePath,
                        { folder: "Products/" }
                    );
                    newPhotos.push({
                        url: cloudinaryResponse.secure_url,
                        public_id: cloudinaryResponse.public_id
                    });

                    fs.unlinkSync(imagePath);
                }
                resolve(true);
            });
        });
    }

    const product = await ProductModel.create({
        name,
        description,
        slug,
        photos: JSON.stringify(newPhotos),
    });

    const createdSizes = await Promise.all(sizes.map( async size => {
        return await ProductSizeModel.create({
            productId: product.id,
            name: size.name,
            price: size.price,
        });
    }));

    const createdIngredientTypes = await Promise.all(ingredientTypes.map( async ingredientType => {
        return await ProductIngredientTypeModel.create({
            productId: product.id,
            min: ingredientType.min,
            max: ingredientType.max,
            type: ingredientType.type,
        });
    }));

    const createdIngredients = await Promise.all(ingredients.map( async ingredient => {
        return await ProductIngredientModel.create({
            productId: product.id,
            name: ingredient.name,
            price: ingredient.price,
            type: ingredient.type,
        });
    }));

    return {
        ...product.dataValues,
        sizes: createdSizes,
        ingredients: createdIngredients,
        ingredientTypes: createdIngredientTypes,
    };
};

exports.update = async (
    id,
    active,
    name,
    description,
    slug,
    sizes,
    ingredientTypes,
    ingredients,
    photos,
) => {
    if ((!photos.length || photos.length < 1) && !Array.isArray(photos)) {
        let arrayAuxPhotos = [];
        arrayAuxPhotos.push(photos);
        photos = arrayAuxPhotos;
    }

    let newPhotos = [];

    const uploadPath = __dirname + "/../public/img/product/";
    for (const photo of photos) {
        await new Promise(resolve => {
            const imageName = uuidv4() + path.extname(photo.name);
            const imagePath = uploadPath + imageName;

            photo.mv(imagePath, async error => {
                if (error) throw error;
                else {
                    const cloudinaryResponse = await cloudinary.uploader.upload(
                        imagePath,
                        { folder: "Products/" }
                    );
                    newPhotos.push({
                        url: cloudinaryResponse.secure_url,
                        public_id: cloudinaryResponse.public_id
                    });

                    fs.unlinkSync(imagePath);
                }
                resolve(true);
            });
        });
    }

    const product = await ProductModel.findByPk(id);

    const JSONProductPhotos = JSON.parse(product.photos);

    await JSONProductPhotos.forEach(async productPhoto => {
        await cloudinary.uploader.destroy(productPhoto.public_id);
    });

    const newProduct = await ProductModel.update({
        active,
        name,
        description,
        slug,
        photos: JSON.stringify(newPhotos),
    }, {
        where: {
            id,
        },
    });

    const udpatedSizes = await Promise.all(sizes.map( async size => {
        return await ProductSizeModel.update({
            productId: product.id,
            name: size.name,
            price: size.price,
        }, {
            where: {
                id: size.id,
            },
        });
    }));
    await ProductSizeModel.destroy({
        where: {
            productId: product.id,
            id: {
                [Op.notIn]: sizes.map(s => s.id)
            }
        }
    });

    const udpatedIngredientTypes = await Promise.all(ingredientTypes.map( async ingredientType => {
        return await ProductIngredientTypeModel.update({
            productId: product.id,
            min: ingredientType.min,
            max: ingredientType.max,
            type: ingredientType.type,
        }, {
            where: {
                id: ingredientType.id,
            },
        });
    }));
    await ProductIngredientTypeModel.destroy({
        where: {
            productId: product.id,
            id: {
                [Op.notIn]: ingredientTypes.map(s => s.id)
            }
        }
    });

    const udpatedIngredients = await Promise.all(ingredients.map( async ingredient => {
        return await ProductIngredientModel.update({
            productId: product.id,
            name: ingredient.name,
            price: ingredient.price,
            type: ingredient.type,
        }, {
            where: {
                id: ingredient.id,
            },
        });
    }));
    await ProductIngredientModel.destroy({
        where: {
            productId: product.id,
            id: {
                [Op.notIn]: ingredients.map(s => s.id)
            }
        }
    });

    return {
        ...newProduct.dataValues,
        sizes: udpatedSizes,
        ingredients: udpatedIngredients,
        ingredientTypes: udpatedIngredientTypes,
    };
};

exports.updateActive = async (id, active) => {
    const product = await ProductModel.update({ active }, { where: { id } });
    return product;
};
