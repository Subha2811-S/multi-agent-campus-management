
import express from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Timetable from "../models/Timetable.js";
import Classroom from "../models/Classroom.js";

const router = express.Router();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// backend/src/routes -> campus-management/rl-engine/main.py
const pythonScriptPath = path.resolve(
  currentDirectory,
  "../../../rl-engine/main.py"
);

function runPythonEngine(payload) {
  return new Promise((resolve, reject) => {
    const pythonCommand = process.env.PYTHON_EXECUTABLE || "python";

    const child = spawn(pythonCommand, [pythonScriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill();
      if (!settled) {
        settled = true;
        reject(new Error("RL engine timed out after 60 seconds."));
      }
    }, 60000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(
          new Error(
            `Could not start Python. Check Python installation. ${error.message}`
          )
        );
      }
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (settled) return;
      settled = true;

      if (code !== 0) {
        return reject(
          new Error(stderr.trim() || `Python exited with code ${code}`)
        );
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(
          new Error(
            `RL engine returned invalid JSON. Output: ${stdout.slice(0, 500)}`
          )
        );
      }
    });

    child.stdin.on("error", (error) => {
      if (!settled) {
        child.kill();
        clearTimeout(timeout);
        settled = true;
        reject(new Error(`Could not send data to Python: ${error.message}`));
      }
    });

    child.stdin.end(JSON.stringify(payload));
  });
}

// POST /api/rl/optimize
// Generates a proposed schedule; does not update MongoDB.
router.post("/optimize", async (req, res) => {
  try {
    const studentCount = Number(req.body.studentCount ?? 50);
    const semester = req.body.semester;
    const department = req.body.department;
    const batch = req.body.batch;

    if (!Number.isInteger(studentCount) || studentCount < 1) {
      return res.status(400).json({
        success: false,
        message: "studentCount must be a positive integer.",
      });
    }

    const filter = {};

    if (semester !== undefined && semester !== "") {
      const semesterNumber = Number(semester);

      if (
        !Number.isInteger(semesterNumber) ||
        semesterNumber < 1 ||
        semesterNumber > 8
      ) {
        return res.status(400).json({
          success: false,
          message: "Semester must be between 1 and 8.",
        });
      }

      filter.semester = semesterNumber;
    }

    if (department) filter.department = department;
    if (batch) filter.batch = batch;

    const [entries, classrooms] = await Promise.all([
      Timetable.find(filter).lean(),
      Classroom.find({}).lean(),
    ]);

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No timetable entries found for the selected filters.",
      });
    }

    const result = await runPythonEngine({
      entries,
      classrooms,
      studentCount,
    });

    if (!result.success) {
      return res.status(422).json(result);
    }

    return res.json({
      ...result,
      savedToDatabase: false,
      message:
        "Proposed schedule generated. Review it before applying changes.",
    });
  } catch (error) {
    console.error("RL optimization error:", error.message);

    return res.status(500).json({
      success: false,
      message: "RL scheduling failed.",
      error: error.message,
    });
  }
});

export default router;
