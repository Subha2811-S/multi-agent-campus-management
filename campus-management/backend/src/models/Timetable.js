
import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
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
      required: true,
      trim: true,
    },
    classroom: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
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
    this.invalidate("endTime", "End time must be later than start time.");
  }
});

export default mongoose.model("Timetable", timetableSchema);
