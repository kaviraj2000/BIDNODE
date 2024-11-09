const dotenv = require("dotenv");
require("./utils/mongoconfig");
dotenv.config();
const user = require("./Models/SignUp")
const Marketing = require("./Models/Marketing")
const widthrwalModel = require("./Models/Widthwral")
const profile = require("./Models/Profile")
const userModel = require("./Models/SignUp")
const express = require('express');
const apiroute = require('./Routes/ContactUs');
const userroute = require("./Routes/User")
const pannaroute = require("./Routes/Panna")
const widthrwal = require("./Routes/Widthrawl")
const marketing = require("./Routes/Market")
const resultroute = require("./Routes/Result")
const app = express();


const cors = require("cors");
const corsOptions = {
  origin: '*',// Update this with your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};


app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'API data response' });
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());

// API Routes
app.use('/api', apiroute);
app.use('/user', userroute);
app.use("/panna", pannaroute)
app.use("/payment", widthrwal)
app.use("/market", marketing)
app.use("/result", resultroute)

app.get('/api/user-stats', async (req, res) => {
  try {
    const totalUsers = await user.countDocuments();
    const totalMarketings = await Marketing.countDocuments();
    const widthrwalModels = await widthrwalModel.countDocuments();
    const paymentsucees = await widthrwalModel.countDocuments({ payment_status: 1 });
    const paymentwidthrwal = await widthrwalModel.countDocuments({ payment_status: 0 });
    const UserData = await userModel.find({role :"subadmin"});
    const ProfileData = await userModel.find({role :"admin"});

    const approvedUsers = await user.countDocuments({ user_status: 'active' });
    const unapprovedUsers = await user.countDocuments({ user_status: 'inactive' });

    res.json({
      ProfileData,
      UserData,
      paymentsucees,
      totalUsers,
      approvedUsers,
      totalMarketings,
      paymentwidthrwal,
      widthrwalModels,
      unapprovedUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving user statistics' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
