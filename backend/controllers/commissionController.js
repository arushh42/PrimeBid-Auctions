import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { uploadImage, validateImage } from "../utils/cloudinary.js";

export const proofOfCommission = catchAsyncErrors(async (req, res, next) => {
  const amount = Number(req.body.amount);
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0 || !comment) {
    return next(new ErrorHandler("A valid amount and a comment are required.", 400));
  }

  const unpaid = req.user.unpaidCommission;
  if (unpaid <= 0) {
    return next(new ErrorHandler("You don't have any unpaid commissions.", 400));
  }

  // Count proofs that are still waiting to be settled.
  const [{ total: inReview = 0 } = {}] = await PaymentProof.aggregate([
    { $match: { userId: req.user._id, status: { $in: ["Pending", "Approved"] } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const remaining = Math.max(0, Math.round((unpaid - inReview) * 100) / 100);
  if (remaining <= 0) {
    return next(
      new ErrorHandler(
        "Your submitted proofs already cover your unpaid commission. Please wait for them to be reviewed.",
        400
      )
    );
  }
  if (amount > remaining) {
    return next(
      new ErrorHandler(
        `The amount exceeds your outstanding balance. Please enter an amount up to ${remaining}.`,
        400
      )
    );
  }

  const proofFile = req.files?.proof;
  validateImage(proofFile, "Payment proof screenshot");
  const proof = await uploadImage(proofFile, "MERN_AUCTION_PAYMENT_PROOFS");

  const commissionProof = await PaymentProof.create({
    userId: req.user._id,
    proof,
    amount,
    comment,
  });
  res.status(201).json({
    success: true,
    message:
      "Your proof has been submitted. We will review it and respond within 24 hours.",
    commissionProof,
  });
});
