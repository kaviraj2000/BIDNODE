const router = require('express').Router();

const withdrawaldata = require("../Controller/Widthwral")

const { validateToken } = require('../Controller/UserController')

router.post("/withdrawal", validateToken, withdrawaldata.withdrawalAdd)

router.post("/withdrawal/data", withdrawaldata.adminwithdrawalAdd)

router.post("/success/data", withdrawaldata.AdminsuccessAdd)



router.post("/success", validateToken, withdrawaldata.successAdd)
router.get("/widtrawalreq", withdrawaldata.WidthrawalRate)


router.get("/receive", validateToken, withdrawaldata.amountget)

module.exports = router
