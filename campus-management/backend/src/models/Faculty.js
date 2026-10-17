
import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Faculty name is required"],
      trim: true,
      minlength: [3, "Name must contain at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },

    subjects: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],
      required: true,
      validate: {
        validator: (subjects) =>
          Array.isArray(subjects) &&
          subjects.length > 0 &&
          subjects.every((subject) => subject.length > 0),
        message: "Enter at least one valid subject",
      },
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
      validate: {
        validator: (value) =>
          !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Enter a valid email address",
      },
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    weeklyWorkload: {
      type: Number,
      default: 0,
      min: [0, "Workload cannot be negative"],
      max: [60, "Workload cannot exceed 60 hours"],
    },
  },
  { timestamps: true }
);

facultySchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } },
  }
);

export default mongoose.models.Faculty ||
  mongoose.model("Faculty", facultySchema);
