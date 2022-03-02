const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserModel = require("../models/User.model");
const AddressModel = require("../models/Address.model");

exports.findAll = async (
    limit = -1,
    page = 1,
    columnSort = "id",
    directionSort = "asc",
    search = ""
) => {
    const result = await UserModel.findAndCountAll({
        limit,
        offset: limit * (page - 1),
        order: [[columnSort, directionSort]],
        where: {
            name: {
                [Op.like]: "%" + search + "%"
            }
        }
    });
    return { totalRows: result.count, users: result.rows };
};

exports.create = async (name, email, password) => {
    const hashPassword = bcrypt.hashSync(password, 10);
    const user = await UserModel.create({
        name,
        email,
        password: hashPassword
    });
    return user;
};

exports.auth = async (email, password) => {
    let user = await UserModel.findOne({ where: { email } });
    if (user) {
        if (!bcrypt.compareSync(password, user.password))
            return { status: 400, msg: "Senha inválida" };

        const token = await jwt.sign({ id: user.id }, process.env.JWT_SECRET);

        user = {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin
        };
        return {
            status: 200,
            auth: true,
            user,
            token,
            msg: "Usuário logado com sucesso"
        };
    } else return { status: 400, msg: "Usuário inválido" };
};

exports.logout = async () => {
    await jwt.sign({}, process.env.JWT_SECRET, {
        expiresIn: 1
    });
};

exports.update = async (userId, data) => {
    await UserModel.update(data, {
        where: { id: userId }
    });
    const user = await UserModel.findByPk(userId);
    return { status: 200, user, msg: "Usuário alterado com sucesso" };
};

exports.getUserAuth = async token => {
    if (!token)
        return {
            user: null,
            status: 401,
            auth: false,
            msg: "Usuário não está logado"
        };

    const userToken = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findByPk(userToken.id);

    if (!userToken)
        return {
            user: null,
            status: 401,
            auth: false,
            msg: "Usuário não está logado"
        };

    const address = await AddressModel.findOne({ where: { userId: user.id } });

    return {
        user,
        address,
        status: 200,
        auth: true,
        msg: "Usuário está logado"
    };
};

exports.updateAddress = async (
    userId,
    address,
    number,
    postalCode,
    city,
    state,
    district,
    complement,
    phone,
    description
) => {
    const addressExists = await AddressModel.findOne({ where: { userId } });
    let newAddress;
    if (addressExists) {
        await AddressModel.update(
            {
                userId,
                address,
                number,
                postalCode,
                city,
                state,
                district,
                complement,
                phone,
                description
            },
            {
                where: { userId }
            }
        );
        newAddress = await AddressModel.findOne({ where: { userId } });
    } else {
        newAddress = await AddressModel.create({
            userId,
            address,
            number,
            postalCode,
            city,
            state,
            district,
            complement,
            phone,
            description
        });
    }

    return { newAddress, status: 200, msg: "Endereço atualizado com sucesso" };
};
