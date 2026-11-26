/**
 * One-off migration for databases created by the old version of this app.
 * Safe to run more than once.
 *
 *   npm run migrate
 *
 * - Converts auction startTime/endTime from text ("Thu Nov 26 2026 ...") to real dates
 * - Moves paymentMethods.easypaisa -> paymentMethods.wallet
 * - Lower-cases user emails (logins are now case-insensitive)
 * - Removes duplicate bid records so the new unique index can be built
 * - Syncs indexes
 */
import mongoose from "mongoose";
import { assertRequiredEnv, env } from "../config/env.js";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { User } from "../models/userSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { Commission } from "../models/commissionSchema.js";

assertRequiredEnv();
await mongoose.connect(env.mongoUri, { dbName: env.dbName });
const db = mongoose.connection.db;

// 1. Auction dates stored as strings
let fixedDates = 0;
const auctions = db.collection("auctions");
const stringDated = auctions.find({
  $or: [{ startTime: { $type: "string" } }, { endTime: { $type: "string" } }],
});
for await (const doc of stringDated) {
  const update = {};
  for (const field of ["startTime", "endTime"]) {
    if (typeof doc[field] === "string") {
      const parsed = new Date(doc[field]);
      if (Number.isNaN(parsed.getTime())) {
        console.warn(`Auction ${doc._id}: could not parse ${field} "${doc[field]}"`);
        continue;
      }
      update[field] = parsed;
    }
  }
  if (Object.keys(update).length) {
    await auctions.updateOne({ _id: doc._id }, { $set: update });
    fixedDates++;
  }
}
console.log(`Auction dates converted: ${fixedDates}`);

// 2. Easypaisa -> wallet
const users = db.collection("users");
let movedWallets = 0;
for await (const doc of users.find({ "paymentMethods.easypaisa": { $exists: true } })) {
  const accountId = doc.paymentMethods?.easypaisa?.easypaisaAccountNumber;
  const update = { $unset: { "paymentMethods.easypaisa": "" } };
  if (accountId !== undefined && accountId !== null && accountId !== "") {
    update.$set = {
      "paymentMethods.wallet": { provider: "Easypaisa", accountId: String(accountId) },
    };
  }
  await users.updateOne({ _id: doc._id }, update);
  movedWallets++;
}
console.log(`Wallet details migrated: ${movedWallets}`);

// 3. Lower-case emails
let loweredEmails = 0;
for await (const doc of users.find({ email: { $type: "string", $regex: /[A-Z]/ } })) {
  const lower = doc.email.toLowerCase();
  const clash = await users.findOne({ email: lower, _id: { $ne: doc._id } });
  if (clash) {
    console.warn(`User ${doc._id}: cannot lower-case ${doc.email}, ${lower} already exists.`);
    continue;
  }
  await users.updateOne({ _id: doc._id }, { $set: { email: lower } });
  loweredEmails++;
}
console.log(`Emails lower-cased: ${loweredEmails}`);

// 4. Duplicate bids (keep the highest per bidder per auction)
const duplicates = await db
  .collection("bids")
  .aggregate([
    { $sort: { amount: -1 } },
    {
      $group: {
        _id: { auctionItem: "$auctionItem", bidder: "$bidder.id" },
        ids: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ])
  .toArray();
let removedBids = 0;
for (const group of duplicates) {
  const [, ...extra] = group.ids;
  const result = await db.collection("bids").deleteMany({ _id: { $in: extra } });
  removedBids += result.deletedCount;
}
console.log(`Duplicate bid records removed: ${removedBids}`);

// 5. Indexes
for (const model of [User, Auction, Bid, PaymentProof, Commission]) {
  try {
    await model.syncIndexes();
  } catch (error) {
    console.warn(`Index sync for ${model.modelName} failed: ${error.message}`);
  }
}
console.log("Indexes synced. Migration complete.");

await mongoose.disconnect();
