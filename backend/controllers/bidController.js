import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";

export const placeBid = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return next(new ErrorHandler("Please enter a valid bid amount.", 400));
  }

  const auctionItem = await Auction.findById(id).select(
    "createdBy currentBid startingBid"
  );
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  if (auctionItem.createdBy.toString() === req.user._id.toString()) {
    return next(new ErrorHandler("You cannot bid on your own auction.", 400));
  }
  if (amount < auctionItem.startingBid) {
    return next(
      new ErrorHandler(`Bid must be at least the starting bid (${auctionItem.startingBid}).`, 400)
    );
  }
  if (amount <= auctionItem.currentBid) {
    return next(
      new ErrorHandler(`Bid must be higher than the current bid (${auctionItem.currentBid}).`, 400)
    );
  }

  const now = new Date();
  const userId = req.user._id;
  const liveAndOutbid = {
    _id: id,
    currentBid: { $lt: amount },
    startTime: { $lte: now },
    endTime: { $gt: now },
  };
  const profileImage = req.user.profileImage?.url;

  // Atomic: update the bidder's existing entry, or push a new one, only if
  // this bid is still the highest and the auction is still live.
  let result = await Auction.updateOne(
    { ...liveAndOutbid, "bids.userId": userId },
    { $set: { currentBid: amount, "bids.$.amount": amount } }
  );
  if (result.matchedCount === 0) {
    result = await Auction.updateOne(
      { ...liveAndOutbid, "bids.userId": { $ne: userId } },
      {
        $set: { currentBid: amount },
        $push: {
          bids: { userId, userName: req.user.userName, profileImage, amount },
        },
      }
    );
  }
  if (result.matchedCount === 0) {
    return next(
      new ErrorHandler(
        "Your bid could not be placed. Someone may have outbid you or the auction has ended. Please refresh and try again.",
        409
      )
    );
  }

  await Bid.findOneAndUpdate(
    { auctionItem: id, "bidder.id": userId },
    {
      amount,
      bidder: { id: userId, userName: req.user.userName, profileImage },
      auctionItem: id,
    },
    { upsert: true }
  );

  res.status(201).json({
    success: true,
    message: "Bid placed.",
    currentBid: amount,
  });
});
