import mongoose, { type Document, Schema } from "mongoose";

export type UserStatus = "online" | "offline" | "busy" | "away";

export interface IUser extends Document {
  username: string;
  password: string; // bcrypt hash
  avatar?: string;
  bio?: string;
  status: UserStatus;
  publicKey?: string;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: undefined,
    },
    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },
    status: {
      type: String,
      enum: ["online", "offline", "busy", "away"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: () => new Date(),
    },
    publicKey: {
      type: String,
      default: undefined,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
