import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee"
    },
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"]
    },
    profile: {
      employeeId: {
        type: String,
        trim: true,
        default: ""
      },
      department: {
        type: String,
        trim: true,
        default: ""
      },
      designation: {
        type: String,
        trim: true,
        default: ""
      },
      phone: {
        type: String,
        trim: true,
        default: ""
      },
      workLocation: {
        type: String,
        trim: true,
        default: ""
      },
      joiningDate: {
        type: Date,
        default: null
      },
      managerName: {
        type: String,
        trim: true,
        default: ""
      },
      skills: {
        type: String,
        trim: true,
        default: ""
      },
      linkedIn: {
        type: String,
        trim: true,
        default: ""
      },
      portfolio: {
        type: String,
        trim: true,
        default: ""
      },
      bio: {
        type: String,
        trim: true,
        default: ""
      }
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema, "adminemployees");

export default User;
