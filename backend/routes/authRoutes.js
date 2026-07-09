import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const sendAuthResponse = (res, user) => {
  res.json({
    token: createToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus || "approved",
      profile: user.profile
    }
  });
};

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const normalizedRole = role === "admin" ? "admin" : "employee";
    const user = await User.create({
      name,
      email,
      password,
      role: normalizedRole,
      accountStatus: normalizedRole === "admin" ? "approved" : "pending"
    });

    if (user.role === "employee") {
      return res.status(201).json({
        pendingApproval: true,
        message: "Your account request has been sent to admin. Ask admin for approval before signing in."
      });
    }

    sendAuthResponse(res, user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.role === "employee" && user.accountStatus === "pending") {
      return res.status(403).json({
        pendingApproval: true,
        message: "Ask admin for approval of your account before signing in."
      });
    }

    if (user.role === "employee" && user.accountStatus === "rejected") {
      return res.status(403).json({ message: "Your employee account request was rejected by admin." });
    }

    sendAuthResponse(res, user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    accountStatus: req.user.accountStatus || "approved",
    profile: req.user.profile
  });
});

router.get("/employee-approvals", protect, requireRole("admin"), async (_req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
      accountStatus: { $in: ["pending", "rejected"] }
    })
      .select("name email accountStatus createdAt profile")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/employee-approvals/:id", protect, requireRole("admin"), async (req, res) => {
  try {
    const { accountStatus } = req.body;

    if (!["approved", "rejected"].includes(accountStatus)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, role: "employee" },
      { accountStatus },
      { new: true, runValidators: true }
    ).select("name email accountStatus createdAt profile");

    if (!employee) {
      return res.status(404).json({ message: "Employee request not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Only employees can update profile information" });
    }

    const allowedFields = [
      "employeeId",
      "department",
      "designation",
      "phone",
      "workLocation",
      "joiningDate",
      "managerName",
      "skills",
      "linkedIn",
      "portfolio",
      "bio"
    ];

    const profile = allowedFields.reduce((nextProfile, field) => {
      if (field in req.body) {
        nextProfile[field] = req.body[field] === "" && field === "joiningDate" ? null : req.body[field];
      }

      return nextProfile;
    }, {});

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: Object.fromEntries(Object.entries(profile).map(([key, value]) => [`profile.${key}`, value])) },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus || "approved",
      profile: user.profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
