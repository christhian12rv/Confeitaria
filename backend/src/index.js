const express = require("express");
const app = express();
const PORT = 9090;
if (process.env.NODE_ENV !== "production")
    require("dotenv").config();

const cors = require("cors");
const bodyParser = require("body-parser");
const sequelize = require("./db");
const fileUpload = require("express-fileUpload");
const session = require("express-session");

const usersRoute = require("./routes/users.route");
const productsRoute = require("./routes/products.route");
const ordersRoute = require("./routes/orders.route");
const cartRoute = require("./routes/cart.route");

app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3 * 1000 * 60 * 60 * 24 }
}));

sequelize.sync().then(() => {
    console.log("Conectado ao MySQL");
}).catch((error) => console.log("Ocorreu um erro ao conectar ao MySQL: " + error));

app.use("/users", usersRoute);
app.use("/products", productsRoute);
app.use("/orders", ordersRoute);
app.use("/cart", cartRoute);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});