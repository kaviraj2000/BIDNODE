const User = require("../Models/SignUp");
const withdrawal = require("../Models/Widthwral");
const catchAsync = require("../utils/catchAsync");

const successAdd = catchAsync(async (req, res, next) => {
    try {
        const userId = req?.user?._id;
        const { transcation_id, amount } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "User information not found in the request or userId is undefined",
                status: false,
            });
        }

        if (!transcation_id || !amount) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // Retrieve the user's account information
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }
        const users = await User.findOne({ role: "admin" });

        // Check if the user is an admin
        if (users.role !== "admin") {
            return res.status(403).json({
                message: "Only admin users can perform this transaction",
                status: false,
            });
        }

        // Check if the amount meets the minimum deposit rate
        if (amount < users.min_desposite_rate) {
            return res.status(400).json({
                message: `Deposit amount must be at least ${users.min_desposite_rate}`,
                status: false,
            });
        }

        // Add the transaction amount to the user's balance
        user.amount = (user.amount || 0) + amount;
        await user.save();

        // Create a new transaction record
        const record = new withdrawal({
            transcation_id,
            amount,
            user_id: userId,
            payment_status: 1,
        });
        await record.save();

        res.status(200).json({
            data: record,
            status: true,
            message: "Transaction successful, amount added to balance",
        });
    } catch (error) {
        console.error("Error in transaction:", error); // Log the error for debugging
        res.status(500).json({ message: "Internal Server Error" });
    }
});


const AdminsuccessAdd = catchAsync(async (req, res, next) => {
    try {
        const { user_id, amount } = req.body;

        // Find the user by their ID
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }

        // Ensure the amount is a valid number
        const amountToAdd = Number(amount);
        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            return res.status(400).json({
                message: "Invalid amount",
                status: false,
            });
        }

        // Add the amount to the user's existing balance
        user.amount = (user.amount || 0) + amountToAdd;
        await user.save();

        // Create a new withdrawal record
        const record = new withdrawal({
            amount: amountToAdd,
            user_id: user_id,
            payment_status: 1
        });
        await record.save();

        // Respond with success
        res.status(200).json({
            data: record,
            status: true,
            message: "Transaction successful, amount added to balance",
        });
    } catch (error) {
        console.error("Error in transaction:", error);
        res.status(500).json({
            message: "Internal Server Error",
            status: false
        });
    }
});



const withdrawalAdd = catchAsync(async (req, res, next) => {
    try {
        const userId = req?.user?._id;
        const { upi_id, amount } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "User information not found in the request or userId is undefined",
                status: false,
            });
        }
        if (!upi_id || !amount) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // Retrieve the user's account information
        const user = await User.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }

        const users = await User.findOne({ role: "admin" });

        // Check if the user is an admin
        if (users.role !== "admin") {
            return res.status(403).json({
                message: "Only admin users can perform this transaction",
                status: false,
            });
        }

        // Check if the amount meets the minimum deposit rate
        if (amount < users.min_widthrawal_rate) {
            return res.status(400).json({
                message: `Deposit amount must be at least ${users.min_widthrawal_rate}`,
                status: false,
            });
        }
        // Check if the user has an amount key
        if (typeof user.amount === 'undefined') {
            return res.status(400).json({
                message: "User balance information is missing",
                status: false,
            });
        }

        // Check if the user has enough balance
        if (user.amount < amount) {
            return res.status(400).json({
                message: "Insufficient balance for withdrawal",
                status: false,
            });
        }

        user.amount -= amount;
        await user.save();

        // Create a new withdrawal record
        const record = new withdrawal({
            upi_id,
            amount,
            payment_Wid_status:"inactive",
            user_id: userId,
            payment_status: 0,
        });
        await record.save();

        res.status(200).json({
            data: record,
            message: "Withdrawal successful",
            status: true,
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: "Internal Server Error" }); // Use status code 500 for server errors
    }
});


const adminwithdrawalAdd = catchAsync(async (req, res, next) => {
    try {
        const { user_id, amount } = req.body;
        if (!user_id || !amount) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const user = await User.findById({ _id: user_id });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }

        if (typeof user.amount === 'undefined') {
            return res.status(400).json({
                message: "User balance information is missing",
                status: false,
            });
        }

        // Check if the user has enough balance
        if (user.amount < amount) {
            return res.status(400).json({
                message: "Insufficient balance for withdrawal",
                status: false,
            });
        }

        user.amount -= amount;
        await user.save();

        // Create a new withdrawal record
        const record = new withdrawal({
            amount,
            user_id: user_id,
            payment_status: 0,
        });
        await record.save();
        res.status(200).json({
            data: record,
            message: "Withdrawal successful",
            status: true,
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ message: "Internal Server Error" }); // Use status code 500 for server errors
    }
});


const amountget = catchAsync(async (req, res) => {
    try {

        const records = await withdrawal.find();

        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No records found",
            });
        }

        res.status(200).json({
            status: true,
            data: records,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
});

const WidthrawalRate = catchAsync(async (req, res) => {
    try {

        const records = await withdrawal.find({payment_status : 0});
        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No records found",
            });
        }

        res.status(200).json({
            status: true,
            data: records,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
});



module.exports = {
    WidthrawalRate,
    withdrawalAdd,
    successAdd,
    amountget,
    adminwithdrawalAdd,
    AdminsuccessAdd
};
