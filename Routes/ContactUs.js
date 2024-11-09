const router = require('express').Router();

const conactc = require("../Controller/ContactController")

router.post("/contact", conactc.contact);


module.exports = router