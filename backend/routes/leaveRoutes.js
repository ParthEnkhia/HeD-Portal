import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import LeaveRequest from "../models/LeaveRequest.js";

const router = express.Router();

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { employee: req.user._id };
    const leaveRequests = await LeaveRequest.find(query)
      .populate("employee", "name email profile")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", requireRole("employee"), async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: "All leave request fields are required" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Start date cannot be after end date" });
    }

    const leaveRequest = await LeaveRequest.create({
      employee: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason
    });

    const populatedRequest = await leaveRequest.populate("employee", "name email profile");
    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "ignored"].includes(status)) {
      return res.status(400).json({ message: "Status must be accepted or ignored" });
    }

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("employee", "name email profile");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findByIdAndDelete(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json({ message: "Leave request deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
