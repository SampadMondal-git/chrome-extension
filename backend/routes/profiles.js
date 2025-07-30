const express = require("express");
const router = express.Router();
const Profile = require("../models/profile");

// POST /api/profiles
router.post("/", async (req, res) => {
  try {
    console.log("📥 Received:", req.body);
    const profile = await Profile.create(req.body);
    res.status(201).json(profile);
  } catch (err) {
    console.error("Error saving:", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// GET /api/profiles
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.findAll({ order: [["createdAt", "DESC"]] });
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// DELETE all profiles
router.delete("/", async (req, res) => {
  try {
    await Profile.destroy({ where: {} });
    res.json({ message: "All profiles deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete profiles" });
  }
});


// DELETE /api/profiles/:id - delete single profile
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Profile.destroy({ where: { id } });
        if (deleted) {
            res.json({ message: `Profile ${id} deleted successfully.` });
        } else {
            res.status(404).json({ error: "Profile not found" });
        }
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Failed to delete profile" });
    }
});
module.exports = router;
