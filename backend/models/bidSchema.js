import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    bidder: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      userName: String,
      profileImage: String,
    },
    auctionItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
  },
  { timestamps: true }
);

bidSchema.index({ auctionItem: 1, "bidder.id": 1 }, { unique: true });

export const Bid = mongoose.model("Bid", bidSchema);
