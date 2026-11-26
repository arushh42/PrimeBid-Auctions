import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { Commission } from "../models/commissionSchema.js";
import { sendEmail } from "../utils/sendEmail.js";
import { env } from "../config/env.js";

export const calculateCommission = (amount) =>
  Math.round(amount * env.commissionRate * 100) / 100;

const paymentInstructions = (auctioneer) => {
  const methods = [];
  const bank = auctioneer.paymentMethods?.bankTransfer;
  if (bank?.bankAccountNumber) {
    methods.push(
      `Bank Transfer:\n- Bank: ${bank.bankName || "-"}\n- Account Name: ${bank.bankAccountName || "-"}\n- Account Number / IBAN: ${bank.bankAccountNumber}`
    );
  }
  const wallet = auctioneer.paymentMethods?.wallet;
  if (wallet?.accountId) {
    methods.push(`${wallet.provider || "Mobile Wallet"}:\n- ${wallet.accountId}`);
  }
  const paypal = auctioneer.paymentMethods?.paypal?.paypalEmail;
  if (paypal) {
    methods.push(`PayPal:\n- ${paypal}`);
  }
  if (methods.length === 0) {
    return "Please contact the auctioneer for payment details.";
  }
  return methods.map((m, i) => `${i + 1}. ${m}`).join("\n\n");
};

/**
 * Finalizes one ended auction exactly once: picks the winner, updates stats,
 * charges the auctioneer's commission, and emails both parties.
 * Safe to call concurrently / from multiple instances (atomic claim).
 */
export const finalizeAuction = async (auctionId) => {
  const auction = await Auction.findOneAndUpdate(
    { _id: auctionId, commissionCalculated: false, endTime: { $lte: new Date() } },
    { $set: { commissionCalculated: true } },
    { new: true }
  );
  if (!auction) return; // already finalized by someone else

  const topBid = [...auction.bids].sort((a, b) => b.amount - a.amount)[0];
  if (!topBid) return; // ended without bids

  const commissionAmount = calculateCommission(topBid.amount);
  await Auction.updateOne(
    { _id: auction._id },
    { $set: { highestBidder: topBid.userId, commissionAmount } }
  );

  const [bidder, auctioneer] = await Promise.all([
    User.findByIdAndUpdate(
      topBid.userId,
      { $inc: { moneySpent: topBid.amount, auctionsWon: 1 } },
      { new: true }
    ),
    User.findByIdAndUpdate(
      auction.createdBy,
      { $inc: { unpaidCommission: commissionAmount } },
      { new: true }
    ),
  ]);

  if (bidder && auctioneer) {
    await sendEmail({
      email: bidder.email,
      subject: `Congratulations! You won the auction for ${auction.title}`,
      message: `Dear ${bidder.userName},

Congratulations! You have won the auction for "${auction.title}" with a bid of ${topBid.amount}.

Before paying, please contact the auctioneer at ${auctioneer.email} to confirm the item details and delivery.

Payment options provided by the auctioneer:

${paymentInstructions(auctioneer)}

Cash on Delivery (COD):
- If you prefer COD, pay 20% of the total upfront using one of the methods above.
- The remaining 80% is paid upon delivery.

Please complete your payment within 7 days. Once the auctioneer confirms payment, the item will be shipped to you.

Thank you for participating!

Best regards,
${env.appName} Team`,
    });

    await sendEmail({
      email: auctioneer.email,
      subject: `Your auction "${auction.title}" has ended`,
      message: `Dear ${auctioneer.userName},

Your auction "${auction.title}" has ended. The winning bid was ${topBid.amount} by ${bidder.userName} (${bidder.email}${bidder.phone ? `, ${bidder.phone}` : ""}).

A platform commission of ${commissionAmount} has been added to your account. Please submit proof of payment from the "Submit Commission" page; you can post new auctions once it is settled.

Best regards,
${env.appName} Team`,
    });
  }
};

/**
 * Settles one approved payment proof exactly once: reduces the user's unpaid
 * commission, records revenue, and emails the user.
 */
export const settleProof = async (proofId) => {
  const proof = await PaymentProof.findOneAndUpdate(
    { _id: proofId, status: "Approved" },
    { $set: { status: "Settled", settledAt: new Date() } },
    { new: true }
  );
  if (!proof) return null;

  // Atomic "subtract but never below zero".
  const user = await User.findByIdAndUpdate(
    proof.userId,
    [
      {
        $set: {
          unpaidCommission: {
            $max: [0, { $subtract: ["$unpaidCommission", proof.amount] }],
          },
        },
      },
    ],
    { new: true }
  );
  if (!user) return proof;

  await Commission.create({
    amount: proof.amount,
    user: user._id,
    paymentProof: proof._id,
  });

  await sendEmail({
    email: user.email,
    subject: "Your payment has been verified and settled",
    message: `Dear ${user.userName},

Your recent commission payment has been verified and settled. Thank you!

Payment details:
- Amount settled: ${proof.amount}
- Remaining unpaid commission: ${user.unpaidCommission}
- Date of settlement: ${new Date().toDateString()}

${user.unpaidCommission > 0 ? "Please settle the remaining balance to keep posting auctions." : "You can now post new auctions without restrictions."}

Best regards,
${env.appName} Team`,
  });

  return proof;
};
