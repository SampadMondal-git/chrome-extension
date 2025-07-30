const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Profile = sequelize.define("Profile", {
  name: DataTypes.STRING,
  url: DataTypes.STRING,
  about: DataTypes.TEXT,
  bio: DataTypes.TEXT,
  location: DataTypes.STRING,
  follower_count: DataTypes.INTEGER,
  connection_count: DataTypes.INTEGER,
  headline: DataTypes.STRING
});

module.exports = Profile;
