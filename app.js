const express = require("express");
const { connectDB } = require("./config/database");
const cors = require("cors");
const User = require("./models/userModel");
const Case = require("./models/caseModel");
const UserCase = require("./models/userCaseModel");
const Faq = require("./models/faqModel");
const Token = require("./models/tokensModel");
const Forms = require("./models/formsModel");
const path = require("path");
const env = require("dotenv");
env.config();
const models = require("./models");
const adminRoutes = require("./Routes/adminRoutes");
const userRoutes = require("./Routes/userRoutes");
const authRoutes = require("./Routes/authRoutes");
const faqRoutes = require("./Routes/faqRoutes");
const formRoutes = require("./Routes/formRoutes");

require("./utils/reminderJob");
const errorHandler = require("./Middleware/errorHandler");

const app = express(); 
 
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: ['https://gurukooltraining.com'],
  methods: 'GET, POST, PUT, DELETE,PATCH, HEAD',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
};

app.use('/uploads',cors(corsOptions),express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
  res.send("Welcome to the Novartis Backend API");
});

app.use("/api", authRoutes);
app.use("/api", adminRoutes);
app.use('/api', userRoutes);
app.use("/api", faqRoutes);
app.use('/api',formRoutes);

app.use(errorHandler);
 
const start = async () => {
  connectDB();
 await User.sync({ force: true });
  await Case.sync({ force: true });
  await UserCase.sync({ force: true });
  await Faq.sync({ force: true });
  await Token.sync({ force: true });
    await Forms.sync({ force: true });
console.log("User table synced");
  app.listen(3000 );
};

start();
