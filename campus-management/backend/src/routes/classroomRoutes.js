
import express from "express";
import Classroom from "../models/Classroom.js";

const router = express.Router();

// Get all classrooms
router.get("/", async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ name: 1 });
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one classroom
router.get("/:id", async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json(classroom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add classroom
router.post("/", async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json(classroom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update classroom
router.put("/:id", async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json(classroom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete classroom
router.delete("/:id", async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json({ message: "Classroom deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
