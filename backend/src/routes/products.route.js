const express = require("express");
const router = express.Router();

const productsValidator = require("../middlewares/validators/products.validator");
const { verifyJWTAdmin } = require("../middlewares/jwtAdminVerify.middleware");

const productsController = require("../controllers/products.controller");

router.get("/:id", productsController.findByPk);
router.get("/", productsController.findAll);
router.post(
    "/",
    verifyJWTAdmin,
    productsValidator.create,
    productsController.create
);
router.put(
    "/",
    verifyJWTAdmin,
    productsValidator.update,
    productsController.update
);

module.exports = router;
