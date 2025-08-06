require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const profileRoutes = require("./Routes/profiles");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/profiles", profileRoutes);

const start = async () => {
  try {
    await sequelize.sync(); // Creates table if not exists
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Database sync failed:", err);
  }
};

start();
