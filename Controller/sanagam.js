const Sangam = require("../Models/Sangam");
const User = require("../Models/SignUp")
const moment = require('moment');
const GameRate = require("../Models/GameRate")
const catchAsync = require("../utils/catchAsync");


const sumOfDigits = (number) => {
    return number.toString().split('').reduce((sum, digit) => sum + Number(digit), 0);
};

exports.SangamAdd = catchAsync(async (req, res, next) => {
    try {
        const userId = req?.user?._id;
        const { type, status, date, open_panna, close_panna, bid_point, marketId } = req.body;
        if (!userId) {
            return res.status(400).json({
                message: "User information not found in the request or userId is undefined.",
                status: false,
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found.",
            });
        }

        // Check if user state is inactive
        if (user.user_status !== 'active') {
            return res.status(403).json({
                status: false,
                message: "Your account is inactive. Please contact support to activate your account.",
            });
        }
        const parsedDate = moment(date, "DD-MM-YYYY", true);
        if (!parsedDate.isValid()) {
            return res.status(400).json({
                status: false,
                message: "Invalid date format. Please use DD-MM-YYYY.",
            });
        }

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found.",
            });
        }

        // Check if the user has enough balance to place the bet
        if (user.amount < bid_point) {
            return res.status(400).json({
                status: false,
                message: "Insufficient balance to place the bet.",
            });
        }

        // Deduct the points from the user's amount
        user.amount -= bid_point;
        await user.save();

        // Calculate the sum of digits for open_panna and close_panna
        const openDigitSum = sumOfDigits(open_panna);
        const closeDigitSum = sumOfDigits(close_panna);

        // Create and save the new record with summed values
        const record = new Sangam({
            type,
            status,
            date: parsedDate, // Adjust date as per requirement
            open_panna: open_panna, // Store the original value
            open_digit: openDigitSum, // Store the sum of the digits of open_panna
            close_panna: close_panna, // Store close_panna directly to close_digit
            close_digit: closeDigitSum, // Store the sum of the digits of close_panna
            bid_point,
            userId,
            marketId,
        });

        await record.save();

        // Send success response
        res.status(201).json({
            data: record,
            status: true,
            message: `${type?.replace("_", " ")} Bid successfully.`,
        });

    } catch (error) {
        console.error("Error adding Sangam record:", error);

        // Send error response
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});




exports.GameRateAdd = catchAsync(async (req, res, next) => {
    const {
        _id,
        single_digit_rate,
        doble_digit_rate,
        Single_panna_rate,
        Doble_panna_rate,
        Triple_panna_rate,
        full_sangam,
        Half_sangam,
        Digit_on,
        dp_motors
    } = req.body;

    const record = await GameRate.findByIdAndUpdate(
        _id,
        {
            single_digit_rate,
            doble_digit_rate,
            Single_panna_rate,
            Doble_panna_rate,
            Triple_panna_rate,
            full_sangam,
            Half_sangam,
            Digit_on,
            dp_motors
        },
        { new: true, runValidators: true }
    );

    if (!record) {
        return res.status(404).json({
            status: false,
            message: "GameRate record not found.",
        });
    }

    res.status(200).json({
        data: record,
        status: true,
        message: "GameRate record updated successfully.",
    });
});


