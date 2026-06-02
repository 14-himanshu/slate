import mongoose, { type Document, Schema } from "mongoose";

export interface IRoom extends Document {
  roomId: string; // The short ID like 'GENERAL' or a custom unique ID
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  isPublic: boolean;
}

const roomSchema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: () => new Date() },
  isPublic: { type: Boolean, default: true }
});

export const Room = mongoose.model<IRoom>("Room", roomSchema);
