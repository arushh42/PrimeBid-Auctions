import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Commission } from "../models/commissionSchema.js";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { deleteImage } from "../utils/cloudinary.js";
import { settleProof } from "../services/auctionService.js";

const assertObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler("Invalid ID format.", 400);
  }
};

const yearRange = (req) => {
  const year = Number(req.query.year) || new Date().getUTCFullYear();
  return {
    year,
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
};

const toMonthlyArray = (rows, valueKey) => {
  const result = Array(12).fill(0);
  rows.forEach((row) => {
    result[row._id.month - 1] = row[valueKey];
  });
  return result;
};

export const deleteAuctionItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  assertObjectId(id);
  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  await Bid.deleteMany({ auctionItem: auctionItem._id });
  await auctionItem.deleteOne();
  await deleteImage(auctionItem.image?.public_id);
  res.status(200).json({
    success: true,
    message: "Auction deleted successfully.",
  });
});

export const getAllPaymentProofs = catchAsyncErrors(async (req, res) => {
  const paymentProofs = await PaymentProof.find().sort({ uploadedAt: -1 }).lean();
  res.status(200).json({
    success: true,
    paymentProofs,
  });
});

export const getPaymentProofDetail = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  assertObjectId(id);
  const paymentProofDetail = await PaymentProof.findById(id)
    .populate("userId", "userName email unpaidCommission")
    .lean();
  if (!paymentProofDetail) {
    return next(new ErrorHandler("Payment proof not found.", 404));
  }
  res.status(200).json({
    success: true,
    paymentProofDetail,
  });
});

const EDITABLE_STATUSES = ["Pending", "Approved", "Rejected"];

export const updateProofStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  assertObjectId(id);
  const status = typeof req.body.status === "string" ? req.body.status : "";
  const amount = Number(req.body.amount);

  if (!EDITABLE_STATUSES.includes(status)) {
    return next(
      new ErrorHandler(`Status must be one of: ${EDITABLE_STATUSES.join(", ")}.`, 400)
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return next(new ErrorHandler("Amount must be a positive number.", 400));
  }

  const existing = await PaymentProof.findById(id);
  if (!existing) {
    return next(new ErrorHandler("Payment proof not found.", 404));
  }
  if (existing.status === "Settled") {
    return next(new ErrorHandler("This payment has already been settled.", 400));
  }

  let proof = await PaymentProof.findOneAndUpdate(
    { _id: id, status: { $ne: "Settled" } },
    { status, amount },
    { new: true, runValidators: true }
  );
  if (!proof) {
    return next(new ErrorHandler("This payment has already been settled.", 409));
  }

  if (status === "Approved") {
    proof = (await settleProof(proof._id)) || proof;
  }

  res.status(200).json({
    success: true,
    message:
      proof.status === "Settled"
        ? "Payment approved and settled."
        : "Payment proof updated.",
    proof,
  });
});

export const deletePaymentProof = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  assertObjectId(id);
  const proof = await PaymentProof.findById(id);
  if (!proof) {
    return next(new ErrorHandler("Payment proof not found.", 404));
  }
  await proof.deleteOne();
  await deleteImage(proof.proof?.public_id);
  res.status(200).json({
    success: true,
    message: "Payment proof deleted.",
  });
});

export const fetchAllUsers = catchAsyncErrors(async (req, res) => {
  const { year, start, end } = yearRange(req);
  const rows = await User.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, role: "$role" },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    year,
    biddersArray: toMonthlyArray(
      rows.filter((row) => row._id.role === "Bidder"),
      "count"
    ),
    auctioneersArray: toMonthlyArray(
      rows.filter((row) => row._id.role === "Auctioneer"),
      "count"
    ),
  });
});

export const monthlyRevenue = catchAsyncErrors(async (req, res) => {
  const { year, start, end } = yearRange(req);
  const rows = await Commission.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    year,
    totalMonthlyRevenue: toMonthlyArray(rows, "totalAmount"),
  });
});
