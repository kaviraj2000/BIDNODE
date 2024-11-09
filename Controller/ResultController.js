const ResultModel = require("../Models/Result");
const Market = require("../Models/Marketing");
const UserModal = require("../Models/SignUp");
const Panna = require("../Models/Panna");
const Sangam = require("../Models/Sangam");

const catchAsync = require("../utils/catchAsync");
const Marketing = require("../Models/Marketing");

// exports.ResultAdd = async (req, res) => {
//     try {
//         const { session, number, betdate, marketId } = req.body;

//         const sumOfDigits = number.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
//         console.log("sumOfDigits", sumOfDigits);

//         const Pannamodel = await Panna.find({}).populate('userId').populate('marketId');
//         if (!Pannamodel || Pannamodel.length === 0) {
//             return res.status(404).json({ message: "No Panna models found." });
//         }

//         const SangamModel = await Sangam.find({}).populate('userId').populate('marketId');
//         if (!SangamModel || SangamModel.length === 0) {
//             return res.status(404).json({ message: "No Sangam models found." });
//         }

//         console.log("SangamModel", SangamModel);

//         // Collect results
//         const results = [];

//         // Check Panna models
//         for (const panna of Pannamodel) {
//             if ((session === 'open' && panna.status === true) || (session === 'close' && panna.status === false)) {
//                 if (panna.point === sumOfDigits) {
//                     const data = new ResultModel({
//                         session,
//                         number,
//                         betdate,
//                         marketId,
//                         panaaModal: panna,
//                         userId: panna.userId // Save userId from Panna
//                     });

//                     console.log("Result data to be saved for Panna:", data);
//                     const result = await data.save();
//                     results.push(result); // Store the result
//                 }
//             }
//         }

//         // Check Sangam models
//         for (const sangam of SangamModel) {
//             if ((session === 'open' && sangam.status === true) || (session === 'close' && sangam.status === false)) {
//                 if (sangam.bid_point === number) {
//                     const data = new ResultModel({
//                         session,
//                         number,
//                         betdate,
//                         marketId,
//                         sangamModal: sangam,
//                         userId: sangam.userId // Save userId from Sangam
//                     });

//                     console.log("Result data to be saved for Sangam:", data);
//                     const result = await data.save();
//                     results.push(result); // Store the result
//                 }
//             }
//         }

//         // Check if any results were saved
//         if (results.length > 0) {
//             return res.status(200).json({
//                 status: 200,
//                 message: "Results saved successfully.",
//                 data: results
//             });
//         }

//         return res.status(400).json({ message: "No matching point found in Panna or Sangam models." });

//     } catch (error) {
//         console.error("Error saving result:", error);
//         res.status(500).json({ message: "An error occurred while saving the result." });
//     }
// };

exports.ResultAdd = async (req, res) => {
    try {
        const { session, number, betdate, marketId, bit_number } = req.body;

        const generatedBitNumber = bit_number || Math.floor(100000 + Math.random() * 900000); // 6-digit random number
        const sumOfDigits = number.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);

        const Pannamodel = await Panna.find({}).populate('userId').populate('marketId');
        const SangamModel = await Sangam.find({}).populate('userId').populate('marketId');

        if ((!Pannamodel || Pannamodel.length === 0) && (!SangamModel || SangamModel.length === 0)) {
            return res.status(404).json({ message: "No Panna or Sangam models found." });
        }

        const resultData = {
            session,
            result: null,
            number,
            betdate,
            marketId,
            bit_number: generatedBitNumber,
            panaaModal: null,
            win_amount :0,
            sangamModal: null,
            userId: null, // This should be set during the matching process
            win_manage: "loser", // Default value is loser
            win_amount: 0 // Default win_amount if no win condition is met
        };

        let pannaWin = false;
        let sangamWin = false;
        for (const panna of Pannamodel) {
            if ((session === 'open' && panna.status === true) || (session === 'close' && panna.status === false)) {
                if (panna.point === sumOfDigits) {
                    resultData.panaaModal = panna;
                    resultData.userId = panna._id; // Set userId from matched Panna
                    resultData.result = panna.marketId.result;
                    pannaWin = true;
                    break;
                }
            }
        }

        for (const sangam of SangamModel) {
            if ((session === 'open' && sangam.status === true) || (session === 'close' && sangam.status === false)) {
                if (sangam.bid_point === number) {
                    resultData.sangamModal = sangam;
                    resultData.userId = sangam._id; // Set userId from matched Sangam
                    resultData.result = sangam.marketId.result;
                    sangamWin = true;
                    break;
                }
            }
        }

        // Set win status
        if (pannaWin || sangamWin) {
            resultData.win_manage = "winner";
        }

        // Check if userId is set before saving
        if (resultData.userId && (resultData.panaaModal || resultData.sangamModal)) {
            const data = new ResultModel(resultData);
            const savedResult = await data.save();

            return res.status(200).json({
                status: 200,
                message: "Result saved successfully.",
                data: savedResult
            });
        }

        return res.status(400).json({ message: "No matching point found in Panna or Sangam models." });

    } catch (error) {
        console.error("Error saving result:", error);
        res.status(500).json({ message: "An error occurred while saving the result." });
    }
};






exports.ResultList = catchAsync(async (req, res) => {
    try {
        const records = await ResultModel.find({})
            .populate('marketId')
            .populate('userId')

            ;

        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No results found.",
            });
        }

        res.status(200).json({
            status: true,
            data: records,
            message: "Results fetched successfully.",
        });
    } catch (error) {
        console.error("Error fetching results:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});

exports.ResultAddMarket = async (req, res) => {
    try {
        const { marketId } = req.body;

        if (!marketId) {
            return res.status(400).json({ message: "Market ID is required." });
        }

        const market = await Market.findById(marketId); 

        if (!market) {
            return res.status(404).json({ message: "Market not found." });
        }

        const sangamData = await Sangam.find({ marketId }); 

        const combinedData = {
            marketName: market.name, 
            sangam: sangamData 
        };

        return res.status(200).json({
            status: 200,
            message: "Result fetched successfully.",
            data: combinedData 
        });

    } catch (error) {
        console.error("Error fetching result:", error);
        res.status(500).json({ message: "An error occurred while fetching the result." });
    }
};


// marketname, close panna, close digit, open pana , open ditig

exports.ResultUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const Pannamodel = await ResultModel.find({ userId }).select('win_manage betdate session bit_number marketId win_amount panaaModal');

        console.log(Pannamodel);
        const marketIds = Pannamodel.map(panna => panna.marketId);
        console.log("marketIds", marketIds);

        const markets = await Marketing.find({ _id: { $in: marketIds } }).select('name type');
        console.log(markets);

        // Create a mapping of markets by ID
        const marketMap = {};
        markets.forEach(market => {
            marketMap[market._id] = { name: market.name, type: market.type };
        });

        // Combine Pannamodels with their corresponding market and extract points from panaaModal
        const combinedResults = Pannamodel.map(panna => {
            // Join points into a single string, separated by commas
            const pointsString = panna.panaaModal.map(modal => modal.point).join(', ');
            const pointsStype = panna.panaaModal.map(modal => modal.type).join(', ');

            return {
                win_manage: panna.win_manage,
                win_amount: panna.win_amount,
                betdate: panna.betdate,
                session: panna.session,
                bit_number: panna.bit_number,
                bid_point: pointsString, // Concatenated points string
                marketName: marketMap[panna.marketId]?.name || null,
                marketType: pointsStype || null,
            };
        });

        // Check if results are found
        if (combinedResults.length === 0) {
            return res.status(200).json({
                status: false,
                message: "No results found.",
                data: []
            });
        }

        return res.status(200).json({
            status: true,
            message: "Result fetched successfully.",
            data: combinedResults
        });

    } catch (error) {
        console.error("Error fetching result:", error);
        res.status(500).json({ message: "An error occurred while fetching the result." });
    }
};








