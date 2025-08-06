const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Profile = sequelize.define("Profile", {
  name: DataTypes.STRING,
  url: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  about: DataTypes.TEXT,
  bio: DataTypes.TEXT,
  location: DataTypes.STRING,
  follower_count: DataTypes.STRING,
  connection_count: DataTypes.STRING
});

module.exports = Profile;
