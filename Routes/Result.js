const { ResultAdd, ResultList, ResultAddMarket, ResultUser, ResultUserHistory } = require("../Controller/ResultController");

const resultroute = require("express").Router();

resultroute.post("/resultadd" , ResultAdd);

resultroute.get("/resultget" , ResultList)

resultroute.post("/market" , ResultAddMarket)

resultroute.post("/winner" , ResultUser)

resultroute.get("/gamedata" , ResultUserHistory)



module.exports = resultroute;
