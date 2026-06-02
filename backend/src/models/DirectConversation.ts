import mongoose, { type Document, Schema } from "mongoose";

export interface IDirectConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  participantPair: string;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const directConversationSchema = new Schema<IDirectConversation>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator: (value: mongoose.Types.ObjectId[]) => value.length === 2,
        message: "Direct conversations must have exactly two participants."
      }
    },
    participantPair: { type: String, required: true, unique: true, index: true },
    lastMessage: { type: Schema.Types.ObjectId, ref: "DirectMessage" },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

directConversationSchema.index({ participants: 1 });

export const DirectConversation = mongoose.model<IDirectConversation>(
  "DirectConversation",
  directConversationSchema
);
