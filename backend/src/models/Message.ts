import mongoose, { type Document, Schema } from "mongoose";

export type MessageType = "text" | "image" | "file" | "audio";

export interface IReaction {
  icon: string;
  userId: mongoose.Types.ObjectId;
  username: string;
}

export interface IMessage extends Document {
  roomId: string;
  userId: mongoose.Types.ObjectId;
  username: string;
  message: string;
  type: MessageType;
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
  edited?: boolean;
  deleted?: boolean;
  replyTo?: mongoose.Types.ObjectId | IMessage;
  reactions?: IReaction[];
  linkPreview?: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string;
  };
  threadId?: mongoose.Types.ObjectId | string;
  threadReplyCount?: number;
  lastThreadReplyAt?: Date;
}

const reactionSchema = new Schema<IReaction>({
  icon: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true }
}, { _id: false });

const messageSchema = new Schema<IMessage>({
  roomId:   { type: String, required: true, index: true },
  userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  message:  { type: String, required: true, maxlength: 2000 },
  type:     { type: String, enum: ["text", "image", "file", "audio"], default: "text" },
  fileUrl:  { type: String },
  fileName: { type: String },
  timestamp: { type: Date, default: () => new Date() },
  edited:   { type: Boolean, default: false },
  deleted:  { type: Boolean, default: false },
  replyTo:  { type: Schema.Types.ObjectId, ref: "Message" },
  reactions: [reactionSchema],
  linkPreview: {
    title: String,
    description: String,
    image: String,
    url: String
  },
  threadId: { type: Schema.Types.ObjectId, ref: "Message" },
  threadReplyCount: { type: Number, default: 0 },
  lastThreadReplyAt: { type: Date }
});

messageSchema.index({ roomId: 1, timestamp: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);

