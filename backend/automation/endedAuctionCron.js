import cron from "node-cron";
import { Auction } from "../models/auctionSchema.js";
import { finalizeAuction } from "../services/auctionService.js";

let running = false;

export const runEndedAuctionJob = async () => {
  if (running) return;
  running = true;
  try {
    const endedAuctions = await Auction.find({
      endTime: { $lte: new Date() },
      commissionCalculated: false,
    })
      .select("_id")
      .limit(200)
      .lean();
    for (const { _id } of endedAuctions) {
      try {
        await finalizeAuction(_id);
      } catch (error) {
        console.error(`Failed to finalize auction ${_id}:`, error);
      }
    }
  } catch (error) {
    console.error("Ended auction job failed:", error);
  } finally {
    running = false;
  }
};

export const endedAuctionCron = () =>
  cron.schedule("* * * * *", runEndedAuctionJob, { noOverlap: true });
