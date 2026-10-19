
import express from "express";
import mongoose from "mongoose";
import Timetable from "../models/Timetable.js";

const router = express.Router();

const academicFields = [
  "academicYear",
  "yearOfStudy",
  "semester",
  "subjectCode",
  "hour",
  "batch",
  "weekType",
];

const editableFields = [
  "day",
  "subject",
  "faculty",
  "classroom",
  "department",
  "startTime",
  "endTime",
  ...academicFields,
];

function normalizeOptionalText(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return typeof value === "string" ? value.trim() || null : value;
}

function validateSemester(value) {
  const semester = Number(value);

  return Number.isInteger(semester) &&
    semester >= 1 &&
    semester <= 8
    ? semester
    : null;
}

function hasValidTimeRange(startTime, endTime) {
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  return (
    typeof startTime === "string" &&
    typeof endTime === "string" &&
    timePattern.test(startTime) &&
    timePattern.test(endTime) &&
    startTime < endTime
  );
}

function buildConflictQuery(entry, excludeId = null) {
  const query = {
    day: entry.day,
    startTime: { $lt: entry.endTime },
    endTime: { $gt: entry.startTime },
    $or: [],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const faculty = normalizeOptionalText(entry.faculty);
  const classroom = normalizeOptionalText(entry.classroom);

  if (faculty) query.$or.push({ faculty });
  if (classroom) query.$or.push({ classroom });

  // If neither faculty nor classroom is supplied,
  // there is no resource conflict to check.
  if (query.$or.length === 0) {
    delete query.$or;
    return null;
  }

  return query;
}

// GET: Fetch timetable entries with optional filters
router.get("/", async (req, res) => {
  try {
    const { semester, day, department, faculty, classroom, academicYear } =
      req.query;

    const filter = {};

    if (semester !== undefined && semester !== "") {
      const semesterNumber = validateSemester(semester);

      if (semesterNumber === null) {
        return res.status(400).json({
          message: "Semester must be a number from 1 to 8",
        });
      }

      filter.semester = semesterNumber;
    }

    if (day) filter.day = day;
    if (department) filter.department = department;
    if (faculty) filter.faculty = faculty;
    if (classroom) filter.classroom = classroom;
    if (academicYear) filter.academicYear = academicYear;

    const entries = await Timetable.find(filter).sort({
      day: 1,
      startTime: 1,
    });

    // Keep the existing array response format so the
    // current frontend can continue to consume it.
    res.json(entries);
  } catch (error) {
    console.error("Fetch timetable error:", error.message);

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
      return res.status(400).json({
        message: "Invalid timetable ID",
      });
    }

    const entry = await Timetable.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        message: "Timetable entry not found",
      });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create a timetable entry
router.post("/", async (req, res) => {
  try {
    const body = { ...req.body };

    for (const field of ["day", "subject", "startTime", "endTime"]) {
      if (
        typeof body[field] !== "string" ||
        !body[field].trim()
      ) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }

      body[field] = body[field].trim();
    }

    for (const field of [
      "faculty",
      "classroom",
      "department",
      "subjectCode",
      "hour",
      "batch",
      "academicYear",
    ]) {
      body[field] = normalizeOptionalText(body[field]);
    }

    if (
      body.semester !== undefined &&
      body.semester !== null &&
      body.semester !== ""
    ) {
      body.semester = validateSemester(body.semester);

      if (body.semester === null) {
        return res.status(400).json({
          message: "Semester must be a number from 1 to 8",
        });
      }
    } else {
      body.semester = null;
    }

    if (!hasValidTimeRange(body.startTime, body.endTime)) {
      return res.status(400).json({
        message: "Use valid 24-hour times; end time must be later",
      });
    }

    const conflictQuery = buildConflictQuery(body);

    if (conflictQuery) {
      const conflicts = await Timetable.find(conflictQuery);

      if (conflicts.length > 0) {
        return res.status(409).json({
          message: "Timetable conflict detected",
          conflicts,
        });
      }
    }

    const entry = await Timetable.create(body);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create timetable entry",
      error: error.message,
    });
  }
});

// PUT: Update a timetable entry
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid timetable ID",
      });
    }

    const existing = await Timetable.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Timetable entry not found",
      });
    }

    const updates = {};

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    for (const field of [
      "faculty",
      "classroom",
      "department",
      "subjectCode",
      "hour",
      "batch",
      "academicYear",
    ]) {
      if (field in updates) {
        updates[field] = normalizeOptionalText(updates[field]);
      }
    }

    if ("semester" in updates) {
      if (
        updates.semester === null ||
        updates.semester === ""
      ) {
        updates.semester = null;
      } else {
        updates.semester = validateSemester(updates.semester);

        if (updates.semester === null) {
          return res.status(400).json({
            message: "Semester must be a number from 1 to 8",
          });
        }
      }
    }

    const candidate = {
      ...existing.toObject(),
      ...updates,
    };

    if (
      !hasValidTimeRange(candidate.startTime, candidate.endTime)
    ) {
      return res.status(400).json({
        message: "Use valid 24-hour times; end time must be later",
      });
    }

    const conflictQuery = buildConflictQuery(
      candidate,
      existing._id
    );

    if (conflictQuery) {
      const conflicts = await Timetable.find(conflictQuery);

      if (conflicts.length > 0) {
        return res.status(409).json({
          message: "Timetable conflict detected",
          conflicts,
        });
      }
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

// DELETE: Remove a timetable entry
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid timetable ID",
      });
    }

    const entry = await Timetable.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({
        message: "Timetable entry not found",
      });
    }

    res.json({
      message: "Timetable entry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete timetable entry",
      error: error.message,
    });
  }
});

export default router;
