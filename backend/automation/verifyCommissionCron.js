import cron from "node-cron";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { settleProof } from "../services/auctionService.js";

let running = false;

// Approvals are settled immediately by the admin endpoint; this job is a
// safety net for any proof left in "Approved" (e.g. a crash mid-request).
export const runVerifyCommissionJob = async () => {
  if (running) return;
  running = true;
  try {
    const approvedProofs = await PaymentProof.find({ status: "Approved" })
      .select("_id")
      .limit(200)
      .lean();
    for (const { _id } of approvedProofs) {
      try {
        await settleProof(_id);
      } catch (error) {
        console.error(`Failed to settle payment proof ${_id}:`, error);
      }
    }
  } catch (error) {
    console.error("Verify commission job failed:", error);
  } finally {
    running = false;
  }
};

export const verifyCommissionCron = () =>
  cron.schedule("* * * * *", runVerifyCommissionJob, { noOverlap: true });
