const Panna = require("../Models/Panna");
const Sangam = require("../Models/Sangam");
const moment = require('moment');
const catchAsync = require("../utils/catchAsync");
const User = require("../Models/SignUp");

exports.pannaAdd = catchAsync(async (req, res, next) => {
    try {
        const userId = req?.user?._id;
        const { type, status, date, digit, point, marketId, sangam_type } = req.body;
        // User ID validation
        if (!userId) {
            return res.status(400).json({
                status: false,
                message: "User information not found in the request or userId is undefined.",
            });
        }

        // Validate digit based on type
        if (type === "single_digit") {
            if (!/^\d{1}$/.test(digit)) {
                return res.status(400).json({
                    status: false,
                    message: "For type 'single_digit', digit must be a single digit (0-9)!",
                });
            }
        } else if (type === "single_panna" || type === "double_panna") {
            if (!/^\d{3}$/.test(digit)) {
                return res.status(400).json({
                    status: false,
                    message: "For type 'single_panna' or 'double_panna', digit must be a three-digit number (000-999)!",
                });
            }
        } else if (type === "double_digit") {
            if (!/^\d{2}$/.test(digit)) {
                return res.status(400).json({
                    status: false,
                    message: "For type 'double_digit', digit must be a two-digit number (00-99)!",
                });
            }
        } else {
            return res.status(400).json({
                status: false,
                message: "Invalid type provided!",
            });
        }

        // Parse and validate the date
        const parsedDate = moment(date, "DD-MM-YYYY", true);
        if (!parsedDate.isValid()) {
            return res.status(400).json({
                status: false,
                message: "Invalid date format. Please use DD-MM-YYYY.",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found.",
            });
        }

        if (user.amount < point) {
            return res.status(400).json({
                status: false,
                message: "Insufficient balance to place the bet.",
            });
        }

        // Deduct the points from the user's amount
        user.amount -= point;
        await user.save();
        // Create a new record
        const record = new Panna({
            type,
            status,
            date: parsedDate, // Adjust date if needed
            digit,
            point,
            userId,
            sangam_type,
            marketId,
        });

        await record.save();
        res.status(201).json({
            status: true,
            data: record,
            message: `${type?.replace("_", " ")}  Bid successfully.`,
        });
    } catch (error) {
        console.error("Error adding Panna record:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});




exports.pannalist = catchAsync(async (req, res) => {
    try {
        const records = await Panna.find({}).sort({ date: -1 });
        const sangam = await Sangam.find({}).sort({ date: -1 });
        // if (!records || records.length === 0) {
        //     return res.status(404).json({
        //         status: false,
        //         message: "No records found.",
        //     });
        // }

        res.status(200).json({
            status: true,
            data: records,
            sangam: sangam,
            message: "Records fetched successfully.",
        });
    } catch (error) {
        console.error("Error fetching Panna records:", error);

        // Send error response
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});


exports.bidhistory = catchAsync(async (req, res) => {
    try {
        const records = await Panna.find({})
            .populate('userId').populate("marketId")
            .sort({ date: -1 });

        const sangam = await Sangam.find({}).populate('userId').populate("marketId")
            .sort({ date: -1 });;

        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No records found.",
            });
        }

        res.status(200).json({
            status: true,
            data: records,  // Populated user data will be included here
            sangam: sangam,
            message: "Records fetched successfully.",
        });
    } catch (error) {
        console.error("Error fetching Panna records:", error);

        // Send error response
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});

