import mongoose from "mongoose";

export const PROOF_STATUSES = ["Pending", "Approved", "Rejected", "Settled"];

const paymentProofSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  proof: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "Pending",
    enum: PROOF_STATUSES,
  },
  amount: { type: Number, required: true, min: 0 },
  comment: { type: String, trim: true, maxLength: 1000 },
  settledAt: Date,
});

paymentProofSchema.index({ status: 1 });

export const PaymentProof = mongoose.model("PaymentProof", paymentProofSchema);
