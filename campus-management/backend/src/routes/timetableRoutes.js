
import express from "express";
import mongoose from "mongoose";
import Timetable from "../models/Timetable.js";

const router = express.Router();

// GET: Fetch all timetable entries
router.get("/", async (req, res) => {
  try {
    const { day, department, faculty, classroom } = req.query;

    const filter = {};

    if (day) filter.day = day;
    if (department) filter.department = department;
    if (faculty) filter.faculty = faculty;
    if (classroom) filter.classroom = classroom;

    const entries = await Timetable.find(filter).sort({
      day: 1,
      startTime: 1,
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch timetable",
      error: error.message,
    });
  }
});

// GET: Fetch one timetable entry
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid timetable ID" });
    }

    const entry = await Timetable.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create timetable entry and check conflicts
router.post("/", async (req, res) => {
  try {
    const {
      day,
      subject,
      faculty,
      classroom,
      department,
      startTime,
      endTime,
    } = req.body;

    const requiredFields = {
      day,
      subject,
      faculty,
      classroom,
      department,
      startTime,
      endTime,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be later than start time",
      });
    }

    const overlaps = await Timetable.find({
      day,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      $or: [{ faculty }, { classroom }],
    });

    if (overlaps.length > 0) {
      return res.status(409).json({
        message: "Timetable conflict detected",
        conflicts: overlaps.map((entry) => ({
          id: entry._id,
          subject: entry.subject,
          faculty: entry.faculty,
          classroom: entry.classroom,
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
        })),
      });
    }

    const entry = await Timetable.create(requiredFields);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create timetable entry",
      error: error.message,
    });
  }
});

// PUT: Update timetable entry and check conflicts
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid timetable ID" });
    }

    const existing = await Timetable.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    const fields = [
      "day",
      "subject",
      "faculty",
      "classroom",
      "department",
      "startTime",
      "endTime",
    ];

    const updates = {};

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const candidate = { ...existing.toObject(), ...updates };

    if (candidate.startTime >= candidate.endTime) {
      return res.status(400).json({
        message: "End time must be later than start time",
      });
    }

    const conflicts = await Timetable.find({
      _id: { $ne: existing._id },
      day: candidate.day,
      startTime: { $lt: candidate.endTime },
      endTime: { $gt: candidate.startTime },
      $or: [
        { faculty: candidate.faculty },
        { classroom: candidate.classroom },
      ],
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: "Timetable conflict detected",
        conflicts,
      });
    }

    Object.assign(existing, updates);
    await existing.save();

    res.json(existing);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update timetable entry",
      error: error.message,
    });
  }
});

// DELETE: Remove timetable entry
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid timetable ID" });
    }

    const entry = await Timetable.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }

    res.json({ message: "Timetable entry deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete timetable entry",
      error: error.message,
    });
  }
});

export default router;
