// File: UserController.js

const jwt = require("jsonwebtoken");
const User = require('../Models/SignUp');
const Payment = require('../Models/Widthwral');
const profile = require("../Models/Profile")

const { promisify } = require("util");
const SECRET_ACCESS = process.env.SECRET_ACCESS;
const { successResponse, errorResponse, validationErrorResponse } = require('../Helper/Message');
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/AppError");
const Profile = require("../Models/Profile");

// Sign Token

const signToken = async (payload) => {
    const token = jwt.sign(payload, SECRET_ACCESS, { expiresIn: "8760h" });
    return token;
};
// User Signup
const signup = async (req, res) => {
    const { mpin, phone, username, role } = req.body;
    if (!mpin || !phone || !username || !role) {
        return validationErrorResponse(res, {
            mpin: 'MPIN is required',
            phone: 'Phone is required',
            username: 'Username is required',
            role: 'Role is required'
        });
    }
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return validationErrorResponse(res, { username: 'Username already exists' });
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return validationErrorResponse(res, { phone: 'Phone already exists' });
        }


        // Generate a random 4-digit number for phone_digit
        const randomPhoneDigit = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number

        const newUser = new User({
            role,
            mpin,
            phone,
            phone_digit: randomPhoneDigit,  // Assign random 4-digit number
            username,
        });

        await newUser.save();

        res.status(200).json({
            data: newUser,
            message: "Please verify with OTP",
            status: true
        });
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Error creating user");
    }
};


// OTP Verification
const getotpsingup = async (req, res) => {
    const { id, phone_digit } = req.body;

    if (!id || !phone_digit) {
        return validationErrorResponse(res, {
            id: 'User ID is required',
            phone_digit: 'Phone digit is required',
        });
    }
    try {
        const existingUser = await User.findOne({ _id: id, phone_digit });
        if (!existingUser) {
            return validationErrorResponse(res, { message: 'Invalid ID or phone digit' });
        }
        const token = await signToken({ id: id });


        return successResponse(res, { existingUser, token }, "User verified successfully");
    } catch (error) {
        console.error(error);
        return errorResponse(res, "Error verifying user");
    }
};

// User Login
const login = catchAsync(async (req, res, next) => {
    try {
        const { phone, mpin } = req.body;

        if (!phone || !mpin) {
            return res.status(400).json({
                status: false,
                message: "Phone and MPIN are required!",
            });
        }

        const user = await User.findOne({ phone, mpin });

        if (!user) {
            return res.status(400).json({
                status: false,
                message: "Invalid MPIN or phone",
            });
        }
        if (user.user_status === 'inactive') {
            return res.status(403).json({
                status: false,
                message: "Your account is inactive. Please contact support.",
            });
        }
        const token = await signToken({ id: user._id });

        res.status(200).json({
            status: true,
            message: "Login Successfully!",
            user,
            token,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
});


const Sublogin = catchAsync(async (req, res, next) => {
    try {
        const { phone, mpin, _id } = req.body;

        // Check if _id is provided
        if (!_id) {
            return res.status(400).json({
                status: false,
                message: "User ID is required!",
            });
        }

        const updateFields = {};
        if (phone) updateFields.phone = phone;
        if (mpin) updateFields.mpin = mpin;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                status: false,
                message: "At least one of Phone or MPIN must be provided for update!",
            });
        }

        // Find the user by ID and update
        const user = await User.findByIdAndUpdate(_id, updateFields, {
            new: true, // Returns the updated document
            runValidators: true, // Ensures validation rules are applied
        });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            status: true,
            message: "User information updated successfully!",
            user,
        });
    } catch (error) {
        console.error("Error during user update:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
});

const validateToken = catchAsync(async (req, res, next) => {
    let authHeader = req.headers.Authorization || req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        let token = authHeader.split(" ")[1];
        if (!token) {
            return next(new AppError("Token is missing", 403));
        }

        try {
            const decode = await promisify(jwt.verify)(token, SECRET_ACCESS);
            const result = await User.findById(decode.id);

            if (!result) {
                return next(new AppError("User not found", 404));
            }

            req.user = result;
            next();
        } catch (err) {
            return next(new AppError("Invalid token", 401));
        }
    } else {
        return next(res.status(401).json({ status: false, msg: "Token is missing." }));
    }
});


const user = catchAsync(async (req, res) => {
    if (req.user) {
        res.json({
            status: true,
            user: req.user,
        });
    } else {
        res.json({
            status: false,
            message: "You must be logged in first!",
        });
    }
});

const userlist = catchAsync(async (req, res) => {
    const users = await User.find({ role: 'user' });
    res.json({
        data: users,
        status: true,
    });
});


const UserListId = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                status: false,
                message: "User ID is required.",
            });
        }

        const record = await User.findById(id);
        const payment = await Payment.find({ user_id: id , payment_status :1});
        const userpayment = await Payment.find({ user_id: id , payment_status :0});
console.log("userpayment",userpayment)
        if (!record) {
            return res.status(404).json({
                status: false,
                message: "No User found.",
            });
        }
        res.status(200).json({
            status: true,
            data: record,
            userpayment,userpayment,
            payment: payment,
            message: "User fetched successfully.",
        });
    } catch (error) {
        console.error("Error fetching User:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});




const userlistStatus = catchAsync(async (req, res) => {
    try {
        const users = await User.find({ user_status: 'inactive' });

        if (!users || users.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No inactive users found",
            });
        }

        res.status(200).json({
            status: true,
            data: users,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
});


const updateUserStatus = catchAsync(async (req, res) => {
    try {
        const { _id, user_status } = req.body;
        if (!_id || !user_status) {
            return res.status(400).json({
                message: "User ID and status are required.",
                status: false,
            });
        }

        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false,
            });
        }

        user.user_status = user_status;
        await user.save();

        res.status(200).json({
            message: `User status updated to ${user_status}`,
            status: true,
            data: user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            status: false,
        });
    }
});


// Controller to reset MPIN
const resetMpin = async (req, res) => {
    try {
        const { phone, newMpin } = req.body;

        if (!phone || !newMpin) {
            return res.status(400).json({ message: 'User phone and new MPIN are required' });
        }

        const user = await User.findOne({ phone: phone });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.mpin === newMpin) {
            return res.status(400).json({ message: 'New MPIN cannot be the same as the old MPIN' });
        }

        user.mpin = newMpin;
        await user.save();

        return res.status(200).json({ message: 'MPIN reset successfully' });
    } catch (error) {
        console.error('Error resetting MPIN:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const UserListIdDelete = catchAsync(async (req, res, next) => {
    try {
        const { Id } = req.body;

        if (!Id) {
            return res.status(400).json({
                status: false,
                message: "User ID is required.",
            });
        }

        const record = await User.findOneAndDelete({ _id: Id });

        if (!record) {
            return res.status(404).json({
                status: false,
                message: "user not found.",
            });
        }

        res.status(200).json({
            status: true,
            data: record,
            message: "User deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting user record:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});




const ProfileAdd = catchAsync(async (req, res, next) => {
    try {
        const userId = req?.user?._id;
        const {
            Profile_name,
            Upi_id,
            whatapps,
            phone,
            profile_email,
            marchant_id,
            min_widthrawal_rate,
            min_desposite_rate,
            min_bid_amount,
            welcome_bouns,
            Withrawal,
            App_link,
            message,
            Video_link
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "User information not found in the request or userId is undefined",
                status: false,
            });
        }

        // Update the profile based on userId
        const updatedProfile = await User.findOneAndUpdate(
            { _id :userId },
            {
                Profile_name,
                Upi_id,
                whatapps,
                phone,
                profile_email,
                marchant_id,
                min_widthrawal_rate,
                min_desposite_rate,
                min_bid_amount,
                welcome_bouns,
                Withrawal,
                App_link,
                message,
                Video_link
            },
            { new: true, upsert: true } // `new: true` returns the updated document; `upsert: true` creates it if not found
        );

        if (!updatedProfile) {
            return res.status(404).json({
                status: false,
                message: "Profile not found for the given user ID",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Profile updated successfully",
            data: updatedProfile,
        });

    } catch (error) {
        console.error("Error updating Profile record:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});





const Setting = catchAsync(async (req, res) => {
    try {
        const profile = await User.find({role :"admin"});
        res.status(200).json({
            status: true,
            data: profile,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
});

const SubAdmin = catchAsync(async (req, res) => {
    try {
        const profile = await User.find({role :"subadmin"});
        res.status(200).json({
            status: true,
            data: profile,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
});


module.exports = {
    signup,
    getotpsingup,
    login,
    resetMpin,
    user,
    ProfileAdd,
    UserListIdDelete,
    validateToken,
    SubAdmin,
    updateUserStatus,
    userlist,
    Setting,
    Sublogin,
    UserListId,
    userlistStatus
};
