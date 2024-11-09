const Contactmodel = require("../Models/Contact")

exports.contact = async (req, res) => {
    try {
        const { email, name, phone, message } = req.body;

        const data = new Contactmodel({
            name: name,
            email: email,
            phone: phone,
            message: message
        });

        const result = await data.save();
        if (result) {
            res.json({
                status: 200,
                message: "success"
            });
        } else {
            res.status(500).json({ message: "An error occurred while saving the contact." });
        }
    } catch (error) {
        console.error("Error saving contact:", error);
        res.status(500).json({ message: "An error occurred while saving the contact." });
    }
};
