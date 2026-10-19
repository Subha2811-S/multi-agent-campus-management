
import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String,
      trim: true,
      default: null,
    },
    yearOfStudy: {
      type: Number,
      min: 1,
      max: 4,
      default: null,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: null,
      index: true,
    },
    subjectCode: {
      type: String,
      trim: true,
      default: null,
    },
    hour: {
      type: String,
      trim: true,
      default: null,
    },
    batch: {
      type: String,
      trim: true,
      default: null,
    },
    weekType: {
      type: String,
      enum: ["odd", "even", "both"],
      default: "both",
    },
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    faculty: {
      type: String,
      trim: true,
      default: null,
    },
    classroom: {
      type: String,
      trim: true,
      default: null,
    },
    department: {
      type: String,
      trim: true,
      default: "CSE (AI & ML)",
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
  },
  { timestamps: true }
);

timetableSchema.pre("validate", function () {
  if (
    this.startTime &&
    this.endTime &&
    this.startTime >= this.endTime
  ) {
    this.invalidate(
      "endTime",
      "End time must be later than start time."
    );
  }
});

timetableSchema.index({
  semester: 1,
  day: 1,
  startTime: 1,
});

export default mongoose.model("Timetable", timetableSchema);
