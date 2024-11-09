const marketing = require("../Models/Marketing");
const catchAsync = require("../utils/catchAsync");

exports.MarketingAdd = catchAsync(async (req, res, next) => {
    try {
        const { market_status, open_time, close_time, name, market_type, result } = req.body;
        if (!open_time || !close_time || !name) {
            return res.status(400).json({
                status: false,
                message: "Open time, close time, and name are required!"
            });
        }

        const currentTime = new Date();
        const openTime = new Date();
        const closeTime = new Date();

        const [openHour, openMinute] = open_time.split(':');
        const [closeHour, closeMinute] = close_time.split(':');
        openTime.setHours(openHour, openMinute, 0, 0);
        closeTime.setHours(closeHour, closeMinute, 0, 0);

        let status;
        if (currentTime < openTime) {
            status = "inactive";
        } else if (currentTime >= openTime && currentTime <= closeTime) {
            status = "active";
        } else {
            status = "inactive";
        }

        const record = new marketing({
            market_status: status,
            open_time,
            close_time,
            name,
            market_type,
            result
        });


        await record.save();

        res.status(201).json({
            status: true,
            data: record,
            message: "Market record added successfully.",
        });
    } catch (error) {
        console.error("Error adding market record:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});


exports.MarketList = catchAsync(async (req, res) => {
    try {
        // Fetch records and sort by creation date in descending order (latest first)
        const records = await marketing.find({}).sort({ create_date: -1 });

        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No markets found.",
            });
        }

        const currentDateTime = new Date(); // Get the current date and time

        // Update the market status based on open_time and close_time
        const updatedRecords = records.map(record => {
            const openTimeToday = new Date();
            const closeTimeToday = new Date();
            const [openHours, openMinutes] = record.open_time.split(':');
            const [closeHours, closeMinutes] = record.close_time.split(':');

            openTimeToday.setHours(openHours, openMinutes, 0); // Set hours and minutes for open_time
            closeTimeToday.setHours(closeHours, closeMinutes, 0); // Set hours and minutes for close_time

            // Determine the market status based on the current time
            let status = record.market_status; // Retain existing status initially

            if (currentDateTime > closeTimeToday) {
                status = "inactive"; // Market is inactive after close_time
            } else if (currentDateTime <= closeTimeToday) {
                status = "active"; // Market is active before or equal to close_time
            }

            return {
                ...record._doc, // Spread existing record properties
                market_status: status // Update the market status
            };
        });

        res.status(200).json({
            status: true,
            data: updatedRecords,
            message: "Markets fetched successfully.",
        });
    } catch (error) {
        console.error("Error fetching markets:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});


exports.MarketListStatus = catchAsync(async (req, res) => {
    try {
        // Fetch records and sort by creation date in descending order (latest first)
        const records = await marketing.find({ market_status: active }).sort({ create_date: -1 });

        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No markets found.",
            });
        }

        const currentDateTime = new Date(); // Get the current date and time

        // Update the market status based on open_time and close_time
        const updatedRecords = records.map(record => {
            const openTimeToday = new Date();
            const closeTimeToday = new Date();
            const [openHours, openMinutes] = record.open_time.split(':');
            const [closeHours, closeMinutes] = record.close_time.split(':');

            openTimeToday.setHours(openHours, openMinutes, 0); // Set hours and minutes for open_time
            closeTimeToday.setHours(closeHours, closeMinutes, 0); // Set hours and minutes for close_time

            // Determine the market status based on the current time
            let status = record.market_status; // Retain existing status initially

            if (currentDateTime > closeTimeToday) {
                status = "inactive"; // Market is inactive after close_time
            } else if (currentDateTime <= closeTimeToday) {
                status = "active"; // Market is active before or equal to close_time
            }

            return {
                ...record._doc, // Spread existing record properties
                market_status: status // Update the market status
            };
        });

        res.status(200).json({
            status: true,
            data: updatedRecords,
            message: "Markets fetched successfully.",
        });
    } catch (error) {
        console.error("Error fetching markets:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});



exports.MarketListId = catchAsync(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Market ID is required.",
            });
        }

        const record = await marketing.findById({ _id: id });

        if (!record || record.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No markets found.",
            });
        }

        res.status(200).json({
            status: true,
            data: record,
            message: "Markets fetched successfully.",
        });
    } catch (error) {
        console.error("Error fetching markets:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});

exports.MarketDelete = catchAsync(async (req, res, next) => {
    try {
        const { Id } = req.body;

        // Check if Id exists in the request
        if (!Id) {
            return res.status(400).json({
                status: false,
                message: "Market ID is required.",
            });
        }

        // Find and delete the record by ID
        const record = await marketing.findOneAndDelete({ _id: Id });

        // Check if the record was found and deleted
        if (!record) {
            return res.status(404).json({
                status: false,
                message: "Market not found.",
            });
        }

        // Successfully deleted
        res.status(200).json({
            status: true,
            data: record,
            message: "Market deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting market record:", error);
        res.status(500).json({
            status: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
});


exports.MarketUpdate = catchAsync(async (req, res, next) => {
    try {
        const { Id, market_status, open_time, close_time, name, market_type, result, game_rate } = req.body;

        if (!Id) {
            return res.status(400).json({
                status: false,
                message: "Market ID is required.",
            });
        }

        // Current date and time
        const currentDateTime = new Date();

        // Create Date objects for open_time and close_time based on the current date
        const openTimeToday = new Date();
        const closeTimeToday = new Date();

        // Set the open and close times by updating the hours and minutes
        const [openHours, openMinutes] = open_time.split(':');
        const [closeHours, closeMinutes] = close_time.split(':');

        openTimeToday.setHours(openHours, openMinutes, 0); // Set hours and minutes for open_time
        closeTimeToday.setHours(closeHours, closeMinutes, 0); // Set hours and minutes for close_time

        // Determine the market status based on the current time
        let status = market_status;
        if (currentDateTime < openTimeToday) {
            status = "inactive"; // Market is inactive before open_time
        } else if (currentDateTime >= openTimeToday && currentDateTime <= closeTimeToday) {
            status = "active"; // Market is active during open and close time
        } else {
            status = "inactive"; // Market is inactive after close_time
        }

        // Find the market by ID and update its fields including the dynamic market_status
        const updatedRecord = await marketing.findByIdAndUpdate(
            Id,
            {
                market_status: status,  // Update status dynamically
                open_time,
                close_time,
                name,
                market_type,
                result,
                game_rate  // Assuming game_rate should be updated as well if passed in the request
            },
            { new: true, runValidators: true }
        );

        // Check if the record exists
        if (!updatedRecord) {
            return res.status(404).json({
                status: false,
                message: "Market not found!",
            });
        }

        // Successfully updated
        res.status(200).json({
            status: true,
            data: updatedRecord,
            message: "Market updated successfully.",
        });
    } catch (error) {
        console.error("Error updating market record:", error);
        res.status(500).json({
            status: false,
            message: "An error occurred while updating the market. Please try again later.",
        });
    }
});

