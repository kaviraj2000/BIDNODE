const jwt = require("jsonwebtoken");

require('dotenv').config()


const verifyUserToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).json("Unauthorized request");
    }
    const token = req.headers["authorization"].split(" ")[1];
    //  console.log(token)
    if (!token) {
        return res.status(401).json("Access denied. No token provided.");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.json({
            message: "Invaild token",
            status: 401,
            err: err
        })
    }
};

module.exports = verifyUserToken;