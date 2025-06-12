const marketing = require("../Models/Marketing");
const catchAsync = require("../utils/catchAsync");
const moment = require('moment-timezone');

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
            result: "XXX-XX-XXX"
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
        // Fetch records from the database
        const records = await marketing.find({});

        // If no records found, return a 404 response
        if (!records || records.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No markets found.",
            });
        }

        // Get current date and time (in Asia/Kolkata timezone for consistency)
        const currentDateTime = moment().tz('Asia/Kolkata'); // Ensure you use the correct time zone

        // Array to hold updated market records
        const updatedRecords = [];

        // Loop through each record
        for (let record of records) {

            // Initialize today's open and close times in the specified time zone
            const openTimeToday = moment().tz('Asia/Kolkata');
            const closeTimeToday = moment().tz('Asia/Kolkata');

            // Split open_time and close_time into hours and minutes
            const [closeHours, closeMinutes] = record.close_time.split(':');

            // Set open and close times
            openTimeToday.set('hours', 0).set('minutes', 0).set('seconds', 0);
            closeTimeToday.set('hours', closeHours).set('minutes', closeMinutes).set('seconds', 0);

            // Handle the case where the market crosses midnight (e.g., 10 PM to 6 AM)
            if (closeTimeToday.isBefore(openTimeToday)) {
                closeTimeToday.add(1, 'days'); // Add one day to close time
            }


            // Default status is inactive
            let status = "inactive";

            // Check if the current time is between open_time and close_time
            if (currentDateTime.isBetween(openTimeToday, closeTimeToday, null, '[)')) {
                status = "active"; // Market is active during this time
            }


            // Update the record with the new market status
            const updatedRecord = {
                ...record._doc,  // Keep the original fields
                market_status: status,  // Update the market status
            };

            // Save the updated market status to the database
            const updateResult = await marketing.findByIdAndUpdate(record._id, { market_status: status });

            updatedRecords.push(updatedRecord);  // Add to the updated records array
        }

        // Respond with the updated records
        res.status(200).json({
            status: true,
            data: updatedRecords,
            message: "Markets fetched and statuses updated successfully.",
        });

    } catch (error) {
        console.error("Error fetching and updating markets:", error);
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
        if (!open_time || !close_time || !open_time.includes(':') || !close_time.includes(':')) {
            return res.status(400).json({
                status: false,
                message: "Valid open_time and close_time are required in HH:mm format.",
            });
        }
        // Set the open and close times by updating the hours and minutes

        const [openHours, openMinutes] = open_time.split(':');
        const [closeHours, closeMinutes] = close_time.split(':');

        openTimeToday.setHours(0, 0, 0); // Set hours and minutes for open_time
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

exports.MarketUpdateData = catchAsync(async (req, res, next) => {
    try {
        const { Id, market_status } = req.body;

        if (!Id || !market_status) {
            return res.status(400).json({
                status: false,
                message: "Market ID and market status are required.",
            });
        }

        const marketRecord = await marketing.findById(Id);

        if (!marketRecord) {
            return res.status(404).json({
                status: false,
                message: "Market not found!",
            });
        }

        // Update the market status
        const updatedRecord = await marketing.findByIdAndUpdate(
            Id,
            {
                market_status: market_status, // Directly update the market status
            },
            { new: true, runValidators: true }
        );

        // Check if the record exists after update
        if (!updatedRecord) {
            return res.status(404).json({
                status: false,
                message: "Market not found during update.",
            });
        }

        // Successfully updated
        res.status(200).json({
            status: true,
            data: updatedRecord,
            message: "Market status updated successfully.",
        });
    } catch (error) {
        console.error("Error updating market record:", error);
        res.status(500).json({
            status: false,
            message: "An error occurred while updating the market. Please try again later.",
        });
    }
});


