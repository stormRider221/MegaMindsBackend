const express = require('express');
const router = express.Router();
const { Parent } = require('../models/Parent');
const { School } = require('../models/School');

// POST /social-login
router.post('/google-login', async (req, res) => {
  const { uid, displayName, email, photoURL, role } = req.body;

  if(!role) return res.status(400).json({ success: false, message: "Role required" });

  try {
    let user;

    if(role === "Parent") {
      user = await Parent.findOne({ uid });
      if(!user){
        user = new Parent({
          uid,
          name: displayName,
          email,
          photoURL,
          students: [],
        });
        await user.save();
      }
    } else if(role === "School") {
      user = await School.findOne({ uid });
      if(!user){
        user = new School({
          uid,
          name: displayName,
          email,
          photoURL,
          schoolName: "",
          schoolLogo: "",
          students: [],
        });
        await user.save();
      }
    }

    return res.status(200).json({ success: true, user });

  } catch(err){
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;