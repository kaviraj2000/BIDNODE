const ResultModel = require("../Models/Result");
const Market = require("../Models/Marketing");
const UserModal = require("../Models/SignUp");
const Rates = require("../Models/GameRate");
const Panna = require("../Models/Panna");
const Sangam = require("../Models/Sangam");
const catchAsync = require("../utils/catchAsync");
const Marketing = require("../Models/Marketing");
const GameRate = require("../Models/GameRate");
const moment = require("moment");


function getSumOfDigits(num) {
    return String(num).split("").reduce((sum, digit) => sum + parseInt(digit), 0);
}


function getRecursiveDigitSum(num) {
    const sum = num.toString().split("").reduce((acc, val) => acc + parseInt(val), 0);
    return sum;
}

function getFirstDigitOfSum(num) {
    const sum = getRecursiveDigitSum(num);
    console.log("Sum of digits:", sum);
    return sum.toString()[1] ? sum.toString()[1] : sum.toString()[0];
}


exports.ResultAdd = async (req, res) => {
    try {
        const { session, number, betdate, marketId } = req.body;
        console.log("req.body", req.body);

        let generatedBitNumber;
        let resultDoc = await ResultModel.findOne().populate("marketId");

        if (resultDoc) {
            let combinedBitNumber = {
                resultModelBitNumber: resultDoc.bit_number,
                marketBitNumber: resultDoc.marketId ? resultDoc.marketId.bit_number : null,
            };
            if (session === "close") {
                generatedBitNumber = combinedBitNumber.resultModelBitNumber;
            } else {
                generatedBitNumber = Math.floor(100000 + Math.random() * 900000);
            }
        } else {
            generatedBitNumber = Math.floor(100000 + Math.random() * 900000);
        }

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
            userId: null,
            win_manage: "loser",
            win_rate: 0,
        };

        const sumOfDigits = getSumOfDigits(number);
        console.log("sumOfDigits", sumOfDigits);

        const pannaBetsRaw = await Panna.find({
            marketId: marketId,
            status: true,
        }).populate("userId").populate("marketId");

        const sangamBetsRaw = await Sangam.find({
            marketId: marketId,
            status: true,
        }).populate("userId").populate("marketId");

        const pannaBets = pannaBetsRaw.filter(bet => bet.userId && bet.userId.role === "user");
        const sangamBets = sangamBetsRaw.filter(bet => bet.userId && bet.userId.role === "user");

        const ratesTable = await Rates.findOne(); // Assuming there's only one rates doc
        console.log("ratesTable", ratesTable);

        for (const panna of pannaBets) {
            console.log("Checking panna:", panna._id.toString(), panna.type, panna.digit);
            const pannaDigitStr = panna.digit.toString();
            const pannaDigitSum = pannaDigitStr.split('').reduce((sum, d) => sum + parseInt(d), 0);
            if (
                ["single_digit", "double_digit", "single_panna", "double_panna"].includes(panna.type) &&
                pannaDigitSum === sumOfDigits
            ) {

                resultData.panaaModal = panna;
                resultData.userId = panna.userId._id;
                resultData.win_manage = "winner";
                resultData.win_rate = panna.point;
                resultData.win_amount = panna.point * (ratesTable[`${panna.type}_rate`] || 1);
                console.log(`Matched panna: ${panna.type}, win_amount: ${resultData.win_amount}`);
                break;
            }
        }

        // If no panna match found, try sangam
        if (!resultData.userId) {
            for (const sangam of sangamBets) {
                if (
                    (session === "open" && sangam.open_digit === sumOfDigits) ||
                    (session === "close" && sangam.close_digit === sumOfDigits)
                ) {
                    resultData.sangamModal = sangam;
                    resultData.userId = sangam.userId._id;
                    resultData.win_manage = "winner";
                    resultData.win_rate = sangam.bid_point;
                    resultData.win_amount = sangam.bid_point * (ratesTable.full_sangam || 1);
                    console.log("Matched sangam:", sangam._id.toString());
                    break;
                }
            }
        }

        // Update market result
        let market = await Market.findById(marketId);
        if (market) {
            if (session === "open") {
                const openFirstDigit = getFirstDigitOfSum(number);
                market.result = `${number}-${openFirstDigit}x-xxx`;
            } else if (session === "close") {
                if (market.result) {
                    const resultParts = market.result.split("-");
                    if (resultParts.length === 3) {
                        const openNumber = resultParts[0];
                        const openFirstDigit = getFirstDigitOfSum(openNumber);
                        const closeFirstDigit = getFirstDigitOfSum(number);
                        market.result = `${openNumber}-${openFirstDigit}${closeFirstDigit}-${number}`;
                    }
                } else {
                    const closeFirstDigit = getFirstDigitOfSum(number);
                    market.result = `xxx-x${closeFirstDigit}-${number}`;
                }
            }

            await market.save();
            resultData.result = market.result;
        } else {
            const firstDigit = getFirstDigitOfSum(number);
            resultData.result =
                session === "open"
                    ? `${number}-${firstDigit}x-xxx`
                    : `xxx-x${firstDigit}-${number}`;
        }
        console.log("resultData", resultData);
        const savedResult = await ResultModel.create(resultData);

        if (resultData.userId) {
            const user = await UserModal.findById(resultData.userId);
            console.log("user", user);
            if (user) {
                user.amount = (user.amount || 0) + resultData.win_amount;
                await user.save();
                console.log("User updated with win amount:", user);
            }
        } else {
            console.log("No winner found.");
        }

        return res.status(200).json({
            status: 200,
            message: "Result saved successfully.",
            data: savedResult,
        });
    } catch (error) {
        console.error("Error saving result:", error);
        res.status(500).json({
            message: "An error occurred while saving the result.",
        });
    }
};


exports.ResultList = catchAsync(async (req, res) => {
    try {
        // Fetch the records, sorted by createdAt in descending order, and filter by marketId and session
        const records = await ResultModel.find({})
            .populate('marketId')
            .populate('userId')
            .sort({ betdate: -1 });  // Sorting by createdAt in descending order


        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No results found.",
            });
        }

        // Create a map or logic to filter out duplicates by bit_number
        const latestRecords = [];
        const seenBitNumbers = new Set(); // This will track unique bit_numbers

        for (const record of records) {
            if (record.session === "close") {
                if (!seenBitNumbers.has(record.bit_number)) {
                    seenBitNumbers.add(record.bit_number);
                    latestRecords.push(record);
                }
            } else if (record.session === "open") {
                // For "open" session, always add the record with a new bit_number
                if (!seenBitNumbers.has(record.bit_number)) {
                    seenBitNumbers.add(record.bit_number);
                    latestRecords.push(record);
                }
            }
        }
        // Send the latest records
        res.status(200).json({
            status: true,
            data: latestRecords,
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

        // Get today's date in YYYY-MM-DD format
        const todayDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');

        // Find result by marketId and today's date
        const marketResult = await ResultModel.find({
            marketId,
            betdate: todayDate
        });

        if (!marketResult || marketResult.length === 0) {
            return res.status(404).json({ message: "Today's market results not found." });
        }

        const market = await Market.findById(marketId);
        if (!market) {
            return res.status(404).json({ message: "Market not found." });
        }

        const sangamData = await Sangam.find({ marketId });

        const combinedData = {
            marketName: market.name,
            marketResults: marketResult,
            sangamData
        };

        return res.status(200).json({
            status: 200,
            message: "Today's result fetched successfully.",
            data: combinedData
        });

    } catch (error) {
        console.error("Error fetching result:", error);
        res.status(500).json({ message: "An error occurred while fetching the result." });
    }
};

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

        const combinedResults = Pannamodel.map(panna => {
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

exports.ResultUserHistory = catchAsync(async (req, res) => {
    const rate = await GameRate.findOne();
    res.status(200).json({
        success: true,
        data: rate
    });
});
