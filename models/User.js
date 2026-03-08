import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

/* ================================
   HASH PASSWORD BEFORE SAVE
================================ */

userSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

});

/* ================================
   MATCH PASSWORD (LOGIN)
================================ */

userSchema.methods.matchPassword = async function (enteredPassword) {

  if (!enteredPassword) {
    throw new Error("Password not provided");
  }

  return bcrypt.compare(enteredPassword, this.password);

};

const User = mongoose.model("User", userSchema);

export default User;