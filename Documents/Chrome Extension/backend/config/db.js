const { Sequelize } = require("sequelize");

// Initialize Sequelize with SQLite as the database
const sequelize = new Sequelize({
  dialect: "sqlite",        // Use SQLite dialect (file-based database)
  storage: "./profiles.db", // Path to the SQLite DB file
});

// Export the Sequelize instance to use in models and other files
module.exports = sequelize;
