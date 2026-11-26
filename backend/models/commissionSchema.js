import mongoose from "mongoose";

// One record per settled commission payment; used for the revenue chart.
const commissionSchema = new mongoose.Schema({
  amount: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paymentProof: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentProof" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Commission = mongoose.model("Commission", commissionSchema);
