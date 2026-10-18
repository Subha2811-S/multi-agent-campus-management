
import mongoose from "mongoose";

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Classroom", "Computer Lab", "Science Lab", "Seminar Hall"],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Classroom", classroomSchema);
