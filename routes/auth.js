const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Account = require("../models/Account");


// SIGNUP
router.post("/signup", async (req, res) => {

  try {

    const { name, email, password, accountType } = req.body;

    // check if account exists
    const existingAccount = await Account.findOne({ email });

    if (existingAccount) {
      return res.status(400).json({
        message: "Account already exists"
      });
    }

    // encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create account
    const account = new Account({
      name,
      email,
      password: hashedPassword,
      accountType
    });

    await account.save();

    res.json({
      message: "Account created successfully",
      accountId: account._id
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});



// LOGIN
router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // check if account exists
    const account = await Account.findOne({ email });

    if (!account) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, account.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: account._id,
        email: account.email,
        accountType: account.accountType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      accountId: account._id,
      name: account.name,
      accountType: account.accountType
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

});


module.exports = router;