
import express from "express";
import Faculty from "../models/Faculty.js";

const router = express.Router();

// GET: View all faculty
router.get("/", async (req, res) => {
  try {
    const faculty = await Faculty.find().sort({ createdAt: -1 });
    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch faculty", error: error.message });
  }
});

// GET: View one faculty
router.get("/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json(faculty);
  } catch (error) {
    res.status(400).json({ message: "Invalid faculty ID", error: error.message });
  }
});

// POST: Add faculty
router.post("/", async (req, res) => {
  try {
    const { name, department, subjects, email, isAvailable, weeklyWorkload } = req.body;

    if (!name || !department || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "Name, department, and at least one subject are required",
      });
    }

    const faculty = await Faculty.create({
      name,
      department,
      subjects,
      email: email || undefined,
      isAvailable: isAvailable ?? true,
      weeklyWorkload: weeklyWorkload ?? 0,
    });

    res.status(201).json({ message: "Faculty added successfully", faculty });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT: Update faculty
router.put("/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({ message: "Faculty updated successfully", faculty });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete faculty
router.delete("/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({ message: "Faculty deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete faculty", error: error.message });
  }
});

export default router;
