import mongoose, { type Document, Schema } from "mongoose";

export type DirectMessageType = "text" | "image" | "file";

export interface IDirectReaction {
  icon: string;
  userId: mongoose.Types.ObjectId;
  username: string;
}

export interface IDirectMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  username: string;
  message: string;
  type: DirectMessageType;
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
  edited?: boolean;
  deleted?: boolean;
  replyTo?: mongoose.Types.ObjectId | IDirectMessage;
  reactions?: IDirectReaction[];
  isE2EE?: boolean;
  e2eeData?: {
    iv: string;
    encryptedKeySender: string;
    encryptedKeyRecipient: string;
  };
}

const directReactionSchema = new Schema<IDirectReaction>(
  {
    icon: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true }
  },
  { _id: false }
);

const directMessageSchema = new Schema<IDirectMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "DirectConversation",
    required: true,
    index: true
  },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  message: { type: String, required: true, maxlength: 2000 },
  type: { type: String, enum: ["text", "image", "file"], default: "text" },
  fileUrl: { type: String },
  fileName: { type: String },
  timestamp: { type: Date, default: () => new Date() },
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  replyTo: { type: Schema.Types.ObjectId, ref: "DirectMessage" },
  reactions: [directReactionSchema],
  isE2EE: { type: Boolean, default: false },
  e2eeData: {
    iv: String,
    encryptedKeySender: String,
    encryptedKeyRecipient: String,
  },
});

directMessageSchema.index({ conversationId: 1, timestamp: 1 });

export const DirectMessage = mongoose.model<IDirectMessage>("DirectMessage", directMessageSchema);
