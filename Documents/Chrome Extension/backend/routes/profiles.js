const express = require("express");
const router = express.Router();
const Profile = require("../models/profile");

// POST /api/profiles
router.post("/", async (req, res) => {
  try {
    console.log("Received:", req.body);
    
    if (!req.body.url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    // Check if profile with this URL already exists
    const existingProfile = await Profile.findOne({ where: { url: req.body.url } });
    
    if (existingProfile) {
      console.log(`Profile already exists for URL: ${req.body.url}. Updating existing profile (ID: ${existingProfile.id})`);
      // Update existing profile with new data
      await existingProfile.update(req.body);
      res.status(200).json({ 
        message: "Profile updated", 
        profile: existingProfile,
        action: "updated"
      });
    } else {
      console.log(`Creating new profile for URL: ${req.body.url}`);
      const profile = await Profile.create(req.body);
      console.log(`Profile created successfully with ID: ${profile.id}`);
      res.status(201).json({ 
        message: "Profile created", 
        profile: profile,
        action: "created"
      });
    }
  } catch (err) {
    console.error("Error saving profile:", err);
    
    // Handle unique constraint violation specifically
    if (err.name === 'SequelizeUniqueConstraintError') {
      console.log("Duplicate URL detected by database constraint, fetching existing profile");
      try {
        const existingProfile = await Profile.findOne({ where: { url: req.body.url } });
        if (existingProfile) {
          await existingProfile.update(req.body);
          return res.status(200).json({ 
            message: "Profile updated (duplicate prevented)", 
            profile: existingProfile,
            action: "updated"
          });
        }
      } catch (fetchErr) {
        console.error("Error fetching existing profile:", fetchErr);
      }
    }
    
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
