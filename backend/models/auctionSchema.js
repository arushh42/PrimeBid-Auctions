import mongoose from "mongoose";

export const AUCTION_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Art & Antiques",
  "Jewelry & Watches",
  "Automobiles",
  "Real Estate",
  "Collectibles",
  "Fashion & Accessories",
  "Sports Memorabilia",
  "Books & Manuscripts",
];

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxLength: 120 },
  description: { type: String, required: true, trim: true, maxLength: 5000 },
  startingBid: { type: Number, required: true, min: 1 },
  category: { type: String, required: true, enum: AUCTION_CATEGORIES },
  condition: {
    type: String,
    enum: ["New", "Used"],
    required: true,
  },
  currentBid: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  image: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bids: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      userName: String,
      profileImage: String,
      amount: Number,
    },
  ],
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  commissionCalculated: {
    type: Boolean,
    default: false,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

auctionSchema.index({ endTime: 1, commissionCalculated: 1 });
auctionSchema.index({ createdBy: 1, endTime: 1 });

auctionSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Auction = mongoose.model("Auction", auctionSchema);
