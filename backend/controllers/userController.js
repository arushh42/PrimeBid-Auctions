import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { PUBLIC_SIGNUP_ROLES, User } from "../models/userSchema.js";
import { generateToken, clearToken } from "../utils/jwtToken.js";
import { uploadImage, validateImage } from "../utils/cloudinary.js";

const str = (value) => (typeof value === "string" ? value.trim() : "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = catchAsyncErrors(async (req, res, next) => {
  const userName = str(req.body.userName);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const phone = str(req.body.phone).replace(/[\s-]/g, "");
  const address = str(req.body.address);
  const role = str(req.body.role);

  if (!userName || !email || !phone || !password || !address || !role) {
    return next(new ErrorHandler("Please fill the full form.", 400));
  }
  if (!PUBLIC_SIGNUP_ROLES.includes(role)) {
    return next(new ErrorHandler("Please select a valid role.", 400));
  }
  if (!EMAIL_RE.test(email)) {
    return next(new ErrorHandler("Please provide a valid email.", 400));
  }
  if (password.length < 8 || password.length > 72) {
    return next(
      new ErrorHandler("Password must be between 8 and 72 characters.", 400)
    );
  }

  const paymentMethods = {};
  if (role === "Auctioneer") {
    const bankAccountNumber = str(req.body.bankAccountNumber);
    const bankAccountName = str(req.body.bankAccountName);
    const bankName = str(req.body.bankName);
    const walletProvider = str(req.body.walletProvider);
    const walletAccountId = str(req.body.walletAccountId);
    const paypalEmail = str(req.body.paypalEmail).toLowerCase();

    if (!bankAccountName || !bankAccountNumber || !bankName) {
      return next(
        new ErrorHandler("Please provide your full bank details.", 400)
      );
    }
    if (paypalEmail && !EMAIL_RE.test(paypalEmail)) {
      return next(new ErrorHandler("Please provide a valid PayPal email.", 400));
    }
    paymentMethods.bankTransfer = { bankAccountNumber, bankAccountName, bankName };
    if (walletAccountId) {
      paymentMethods.wallet = { provider: walletProvider || "Mobile Wallet", accountId: walletAccountId };
    }
    if (paypalEmail) {
      paymentMethods.paypal = { paypalEmail };
    }
  }

  const profileImage = req.files?.profileImage;
  validateImage(profileImage, "Profile image");

  const isRegistered = await User.exists({ email });
  if (isRegistered) {
    return next(new ErrorHandler("An account with this email already exists.", 400));
  }

  // Validate everything else before spending an upload.
  const draft = new User({ userName, email, password, phone, address, role, paymentMethods });
  await draft.validate(["userName", "email", "phone", "address"]);

  draft.profileImage = await uploadImage(profileImage, "MERN_AUCTION_PLATFORM_USERS");
  const user = await draft.save();
  generateToken(user, "Registration successful.", 201, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!email || !password) {
    return next(new ErrorHandler("Please enter your email and password.", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }
  generateToken(user, "Logged in successfully.", 200, res);
});

export const getProfile = catchAsyncErrors(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export const logout = catchAsyncErrors(async (req, res) => {
  clearToken(res);
  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

export const fetchLeaderboard = catchAsyncErrors(async (req, res) => {
  const leaderboard = await User.find({ role: "Bidder", moneySpent: { $gt: 0 } })
    .select("userName profileImage.url moneySpent auctionsWon")
    .sort({ moneySpent: -1 })
    .limit(100)
    .lean();
  res.status(200).json({
    success: true,
    leaderboard,
  });
});
