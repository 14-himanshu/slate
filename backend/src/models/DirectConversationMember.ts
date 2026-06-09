import mongoose, { type Document, Schema } from "mongoose";

export interface IDirectConversationMember extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lastReadAt: Date;
  visible: boolean;
}

const directConversationMemberSchema = new Schema<IDirectConversationMember>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "DirectConversation",
      required: true,
      index: true
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastReadAt: { type: Date, default: () => new Date(0) },
    visible: { type: Boolean, default: true }
  },
  { timestamps: true }
);

directConversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const DirectConversationMember = mongoose.model<IDirectConversationMember>(
  "DirectConversationMember",
  directConversationMemberSchema
);
