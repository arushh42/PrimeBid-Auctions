import mongoose from "mongoose";
import { Auction, AUCTION_CATEGORIES } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { deleteImage, uploadImage, validateImage } from "../utils/cloudinary.js";

const str = (value) => (typeof value === "string" ? value.trim() : "");

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const MAX_AUCTION_DAYS = 90;

const validateSchedule = (startTime, endTime) => {
  if (!startTime || !endTime) {
    throw new ErrorHandler("Please provide valid start and end times.", 400);
  }
  // Allow a minute of clock skew between browser and server.
  if (startTime.getTime() < Date.now() - 60 * 1000) {
    throw new ErrorHandler("Auction start time must be in the future.", 400);
  }
  if (startTime >= endTime) {
    throw new ErrorHandler("Auction start time must be before the end time.", 400);
  }
  if (endTime - startTime > MAX_AUCTION_DAYS * 24 * 60 * 60 * 1000) {
    throw new ErrorHandler(`An auction can run for at most ${MAX_AUCTION_DAYS} days.`, 400);
  }
};

const findAuctionOr404 = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler("Invalid ID format.", 400);
  }
  const auction = await Auction.findById(id);
  if (!auction) {
    throw new ErrorHandler("Auction not found.", 404);
  }
  return auction;
};

const assertOwner = (auction, user) => {
  if (auction.createdBy.toString() !== user._id.toString()) {
    throw new ErrorHandler("You can only manage your own auctions.", 403);
  }
};

export const addNewAuctionItem = catchAsyncErrors(async (req, res, next) => {
  const title = str(req.body.title);
  const description = str(req.body.description);
  const category = str(req.body.category);
  const condition = str(req.body.condition);
  const startingBid = Number(req.body.startingBid);
  const startTime = parseDate(req.body.startTime);
  const endTime = parseDate(req.body.endTime);

  if (!title || !description || !category || !condition) {
    return next(new ErrorHandler("Please provide all details.", 400));
  }
  if (!AUCTION_CATEGORIES.includes(category)) {
    return next(new ErrorHandler("Please select a valid category.", 400));
  }
  if (!["New", "Used"].includes(condition)) {
    return next(new ErrorHandler("Please select a valid condition.", 400));
  }
  if (!Number.isFinite(startingBid) || startingBid < 1) {
    return next(new ErrorHandler("Starting bid must be a positive number.", 400));
  }
  validateSchedule(startTime, endTime);

  const image = req.files?.image;
  validateImage(image, "Auction image");

  const activeAuction = await Auction.exists({
    createdBy: req.user._id,
    endTime: { $gt: new Date() },
  });
  if (activeAuction) {
    return next(
      new ErrorHandler(
        "You already have an active or upcoming auction. You can post a new one after it ends.",
        400
      )
    );
  }

  const uploaded = await uploadImage(image, "MERN_AUCTION_PLATFORM_AUCTIONS");
  try {
    const auctionItem = await Auction.create({
      title,
      description,
      category,
      condition,
      startingBid,
      startTime,
      endTime,
      image: uploaded,
      createdBy: req.user._id,
    });
    return res.status(201).json({
      success: true,
      message: "Auction created. It will go live at its scheduled start time.",
      auctionItem,
    });
  } catch (error) {
    await deleteImage(uploaded.public_id);
    throw error;
  }
});

export const getAllItems = catchAsyncErrors(async (req, res) => {
  const items = await Auction.find()
    .select("-bids")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.status(200).json({
    success: true,
    items,
  });
});

export const getAuctionDetails = catchAsyncErrors(async (req, res) => {
  const auctionItem = await findAuctionOr404(req.params.id);
  const bidders = [...auctionItem.bids].sort((a, b) => b.amount - a.amount);
  res.status(200).json({
    success: true,
    auctionItem,
    bidders,
  });
});

export const getMyAuctionItems = catchAsyncErrors(async (req, res) => {
  const items = await Auction.find({ createdBy: req.user._id })
    .select("-bids")
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({
    success: true,
    items,
  });
});

export const removeFromAuction = catchAsyncErrors(async (req, res, next) => {
  const auctionItem = await findAuctionOr404(req.params.id);
  assertOwner(auctionItem, req.user);

  const now = new Date();
  const isLive = auctionItem.startTime <= now && auctionItem.endTime > now;
  if (isLive && auctionItem.bids.length > 0) {
    return next(
      new ErrorHandler("You cannot delete a live auction that already has bids.", 400)
    );
  }
  if (auctionItem.endTime <= now && !auctionItem.commissionCalculated) {
    return next(
      new ErrorHandler("This auction is being finalized. Please try again in a minute.", 409)
    );
  }

  await Bid.deleteMany({ auctionItem: auctionItem._id });
  await auctionItem.deleteOne();
  await deleteImage(auctionItem.image?.public_id);
  res.status(200).json({
    success: true,
    message: "Auction deleted successfully.",
  });
});

export const republishItem = catchAsyncErrors(async (req, res, next) => {
  const auctionItem = await findAuctionOr404(req.params.id);
  assertOwner(auctionItem, req.user);

  if (auctionItem.endTime > new Date()) {
    return next(
      new ErrorHandler("This auction is still active and cannot be republished.", 400)
    );
  }
  if (!auctionItem.commissionCalculated) {
    return next(
      new ErrorHandler("This auction is being finalized. Please try again in a minute.", 409)
    );
  }

  const startTime = parseDate(req.body.startTime);
  const endTime = parseDate(req.body.endTime);
  validateSchedule(startTime, endTime);

  const otherActive = await Auction.exists({
    _id: { $ne: auctionItem._id },
    createdBy: req.user._id,
    endTime: { $gt: new Date() },
  });
  if (otherActive) {
    return next(
      new ErrorHandler("You already have an active or upcoming auction.", 400)
    );
  }

  // Past results (winner stats and commission owed) are kept as they are;
  // the listing simply starts fresh with a new schedule.
  const updated = await Auction.findByIdAndUpdate(
    auctionItem._id,
    {
      startTime,
      endTime,
      bids: [],
      currentBid: 0,
      highestBidder: null,
      commissionCalculated: false,
      commissionAmount: 0,
    },
    { new: true, runValidators: true }
  );
  await Bid.deleteMany({ auctionItem: auctionItem._id });

  res.status(200).json({
    success: true,
    auctionItem: updated,
    message: "Auction republished. It will go live at its new start time.",
  });
});
