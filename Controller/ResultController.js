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



    return sum;
}

exports.ResultAdd = async (req, res) => {
    try {
        const { session, number, betdate, marketId } = req.body;
        console.log("req.body", req.body);
        let generatedBitNumber;
        let resultDoc = await ResultModel.findOne().populate('marketId');
        if (resultDoc) {
            let combinedBitNumber = {
                resultModelBitNumber: resultDoc.bit_number,
                marketBitNumber: resultDoc.marketId ? resultDoc.marketId.bit_number : null
            };
            if (session === "close") {
                generatedBitNumber = combinedBitNumber.resultModelBitNumber;
            } else {
                generatedBitNumber = Math.floor(100000 + Math.random() * 900000);
            }
        } else {
            generatedBitNumber = Math.floor(100000 + Math.random() * 900000);
        }

        const sumOfDigits = getDigitalRoot(number);

        const pannaBets = await Panna.find({
            marketId: marketId,
            status: true
        }).populate('userId').populate('marketId');

        const sangamBets = await Sangam.find({
            marketId: marketId,
            status: true
        }).populate('userId').populate('marketId');

        // Check Panna wins
        for (const panna of pannaBets) {
            if (panna.type === 'single_digit' && panna.digit != sumOfDigits) {
                resultData.panaaModal = panna;
                resultData.userId = panna.userId._id;
                resultData.win_manage = "winner";
                break;
            }
            else if (panna.type === 'doble_digit' && panna.digit != sumOfDigits) {
                resultData.panaaModal = panna;
                resultData.userId = panna.userId._id;
                resultData.win_manage = "winner";
                break;
            }
            if (panna.type === 'single_panna' && panna.digit != sumOfDigits) {
                resultData.panaaModal = panna;
                resultData.userId = panna.userId._id;
                resultData.win_manage = "winner";
                break;
            }
            if (panna.type === 'double_panna' && panna.digit != sumOfDigits) {
                resultData.panaaModal = panna;
                resultData.userId = panna.userId._id;
                resultData.win_manage = "winner";
                break;
            }
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
        };
        // Check Sangam wins if no panna win found
        if (!resultData.userId) {
            for (const sangam of sangamBets) {
                console.log("sangam", sangam);
                if (session === 'open' && sangam.open_digit != sumOfDigits) {
                    resultData.sangamModal = sangam;
                    resultData.userId = sangam.userId._id;
                    resultData.win_manage = "winner";
                    break;
                } else if (session === 'close' && sangam.close_digit != sumOfDigits) {
                    resultData.sangamModal = sangam;
                    resultData.userId = sangam.userId._id;
                    resultData.win_manage = "winner";
                    break;
                }
            }
        }

        // Update market result
        let market = await Market.findById(marketId);
        if (market) {
            if (session === 'open') {
                market.result = `${number}-${sumOfDigits}-xxx`;
            } else if (session === 'close') {
                if (market.result) {
                    const resultParts = market.result.split('-');
                    if (resultParts.length === 3) {
                        market.result = `${resultParts[0]}-${resultParts[1]}-${number}`;
                    }
                }
            }
            await market.save();
            resultData.result = market.result;
        } else {
            resultData.result = session === 'open' ? `${number}-${sumOfDigits}-xxx` : `xxx-xx-${number}`;
        }

        const savedResult = await ResultModel.create(resultData);

        console.log("savedResult", savedResult);
        return res.status(200).json({
            status: 200,
            message: "Result saved successfully.",
            data: savedResult
        });

    } catch (error) {
        console.error("Error saving result:", error);
        res.status(500).json({ message: "An error occurred while saving the result." });
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
            // For "close" session, ensure that the latest record with the same bit_number is retained
            if (record.session === "close") {
                // If bit_number already exists (from open session or previous close session), don't add again
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