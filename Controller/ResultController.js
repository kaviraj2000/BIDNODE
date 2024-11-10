const ResultModel = require("../Models/Result");
const Market = require("../Models/Marketing");
const UserModal = require("../Models/SignUp");
const Panna = require("../Models/Panna");
const Sangam = require("../Models/Sangam");
const catchAsync = require("../utils/catchAsync");
const Marketing = require("../Models/Marketing");

function getDigitalRoot(number) {
    let sum = number
        .toString()
        .split('')
        .reduce((acc, digit) => acc + parseInt(digit), 0);

    // Keep summing the digits until the result is a single digit
    while (sum >= 10) {
        sum = sum
            .toString()
            .split('')
            .reduce((acc, digit) => acc + parseInt(digit), 0);
    }

    return sum;
}

exports.ResultAdd = async (req, res) => {
    try {
        const { session, number, betdate, marketId, bit_number } = req.body;

        const generatedBitNumber = bit_number || Math.floor(100000 + Math.random() * 900000); // 6-digit random number
        const sumOfDigits = getDigitalRoot(number); // Use the digital root function

        // Populate marketId in both Panna and Sangam models to access market result
        const Pannamodel = await Panna.find({}).populate('userId').populate('marketId');
        const SangamModel = await Sangam.find({}).populate('userId').populate('marketId');

       
        const resultData = {
            session,
            result: null,
            number,
            betdate,
            marketId,
            bit_number: generatedBitNumber,
            panaaModal: null,
            win_amount: 0,
            sangamModal: null,
            userId: null, // This should be set during the matching process
            win_manage: "loser", // Default value is "loser"
        };

        let pannaWin = false;
        let sangamWin = false;

        // Check for a match in the Panna model
        for (const panna of Pannamodel) {
            if ((session === 'open' && panna.status === true) || (session === 'close' && panna.status === false)) {
                if (panna.point === sumOfDigits) {
                    resultData.panaaModal = panna;
                    resultData.userId = panna._id; // Set userId from matched Panna
                    resultData.result = panna.marketId.result; // Use result from marketId in Panna
                    pannaWin = true;
                    break; // Break once a match is found
                }
            }
        }

        // Check for a match in the Sangam model
        for (const sangam of SangamModel) {
            if ((session === 'open' && sangam.status === true) || (session === 'close' && sangam.status === false)) {
                if (sangam.bid_point === number) {
                    resultData.sangamModal = sangam;
                    resultData.userId = sangam._id; // Set userId from matched Sangam
                    resultData.result = sangam.marketId.result; // Use result from marketId in Sangam
                    sangamWin = true;
                    break; // Break once a match is found
                }
            }
        }

        // If a win is detected, update win_manage to "winner"
        if (pannaWin || sangamWin) {
            resultData.win_manage = "winner";
        }

        // If no match is found, use the result from marketId if available, or fallback to formatted number
        const numberSum = getDigitalRoot(number); // Apply digital root function here
        console.log("numberSum", numberSum);
        if (!pannaWin && !sangamWin) {
            const market = await Market.findById(marketId); // Fetch the market to get and update the result directly
            resultData.result = market.result || (session === 'open' ? `${number}-${numberSum}x-xxx` : `xxx-x${numberSum}-${number}`);
            console.log("resultData.resultaa", resultData.result);
            if (!market.result) {
                market.result = resultData.result;
                await market.save();
            } else {
                resultData.result = session === 'open' ? `${number}-${numberSum}x-xxx` : `xxx-x${numberSum}-${number}`;
                console.log("resultData.resultaaqqqq", resultData.result);
            }
        }

        // Check if userId is set before saving
        if (resultData.userId) {
            const data = new ResultModel(resultData);
            console.log('data11', data);
            const savedResult = await data.save();

            return res.status(200).json({
                status: 200,
                message: "Result saved successfully.",
                data: savedResult
            });
        }

        // If no match is found in Panna or Sangam, save the result with "loser" status using the market result or formatted result
        const data = new ResultModel(resultData);
        console.log("qq", data);
        const savedResult = await data.save();

        return res.status(200).json({
            status: 200,
            message: "Result saved",
            data: savedResult
        });

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


        // Find the result documents matching the given marketId from ResultModel
        const marketResult = await ResultModel.find({ marketId });

        if (!marketResult || marketResult.length === 0) {
            return res.status(404).json({ message: "Market results not found." });
        }

        // Assuming 'marketId' exists in another collection (e.g., MarketModel)
        const market = await Market.findById(marketId); // Find the Market model by ID

        if (!market) {
            return res.status(404).json({ message: "Market not found." });
        }

        // Fetch Sangam data for the given marketId
        const sangamData = await Sangam.find({ marketId });

        const combinedData = {
            marketName: market.name,
            marketResults: marketResult
        };

        // Return the combined data
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

        const marketIds = Pannamodel.map(panna => panna.marketId);

        const markets = await Marketing.find({ _id: { $in: marketIds } }).select('name type');

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