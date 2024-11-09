const { ResultAdd, ResultList, ResultAddMarket, ResultUser } = require("../Controller/ResultController");

const resultroute = require("express").Router();



resultroute.post("/resultadd" , ResultAdd);

resultroute.get("/resultget" , ResultList)

resultroute.post("/market" , ResultAddMarket)

resultroute.post("/winner" , ResultUser)




module.exports = resultroute;
