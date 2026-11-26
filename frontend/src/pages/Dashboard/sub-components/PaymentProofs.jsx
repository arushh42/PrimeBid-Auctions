import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearSinglePaymentProof,
  deletePaymentProof,
  getSinglePaymentProofDetail,
  updatePaymentProof,
} from "@/store/slices/superAdminSlice";
import { formatDateTime, formatPrice } from "@/lib/utils";

const statusColors = {
  Pending: "text-yellow-600",
  Approved: "text-blue-600",
  Rejected: "text-red-600",
  Settled: "text-green-600",
};

const PaymentProofs = () => {
  const { paymentProofs, singlePaymentProof, submitting } = useSelector(
    (state) => state.superAdmin
  );
  const dispatch = useDispatch();

  const handlePaymentProofDelete = (id) => {
    if (window.confirm("Delete this payment proof? This cannot be undone.")) {
      dispatch(deletePaymentProof(id));
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white mt-5">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-2 px-4">User ID</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Uploaded</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {paymentProofs.length > 0 ? (
              paymentProofs.map((element) => (
                <tr key={element._id} className="border-b border-gray-200">
                  <td className="py-2 px-4 text-center text-sm">{element.userId}</td>
                  <td className="py-2 px-4 text-center">{formatPrice(element.amount)}</td>
                  <td className="py-2 px-4 text-center text-sm">{formatDateTime(element.uploadedAt)}</td>
                  <td className={`py-2 px-4 text-center font-semibold ${statusColors[element.status] || ""}`}>
                    {element.status}
                  </td>
                  <td className="flex items-center py-4 justify-center gap-3">
                    <button
                      className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
                      disabled={element.status === "Settled"}
                      title={element.status === "Settled" ? "Already settled" : ""}
                      onClick={() => dispatch(getSinglePaymentProofDetail(element._id))}
                    >
                      Review
                    </button>
                    <button
                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
                      disabled={submitting}
                      onClick={() => handlePaymentProofDelete(element._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center text-xl text-sky-600 py-3">
                  No payment proofs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {singlePaymentProof?._id && (
        <Drawer
          key={singlePaymentProof._id}
          proof={singlePaymentProof}
          onClose={() => dispatch(clearSinglePaymentProof())}
        />
      )}
    </>
  );
};

export default PaymentProofs;

const Drawer = ({ proof, onClose }) => {
  const { submitting } = useSelector((state) => state.superAdmin);
  // Initialised from the proof being reviewed (remounted per proof via `key`).
  const [amount, setAmount] = useState(proof.amount ?? "");
  const [status, setStatus] = useState(
    ["Pending", "Approved", "Rejected"].includes(proof.status) ? proof.status : "Pending"
  );
  const dispatch = useDispatch();
  const user = proof.userId || {};

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePaymentProofUpdate = () => {
    if (
      status === "Approved" &&
      !window.confirm(
        `Approve and settle ${formatPrice(amount)} for ${user.userName || "this user"}? This reduces their unpaid commission and cannot be undone.`
      )
    ) {
      return;
    }
    dispatch(updatePaymentProof(proof._id, status, Number(amount)));
  };

  return (
    <section className="fixed bottom-0 left-0 w-full h-full bg-[#00000087] flex items-end z-50">
      <div className="bg-white h-fit w-full max-h-full overflow-y-auto">
        <div className="w-full px-5 py-8 sm:max-w-[640px] sm:m-auto">
          <h3 className="text-[#D6482B] text-3xl font-semibold text-center mb-1">
            Review Payment Proof
          </h3>
          <p className="text-stone-600 text-center">
            Approving a proof settles it immediately.
          </p>
          <form className="flex flex-col gap-5 my-5" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-1">
              <label className="text-[16px] text-stone-600">User</label>
              <p className="text-[16px] py-2 border-b border-stone-300">
                {user.userName || "Unknown user"} {user.email ? `(${user.email})` : ""}
              </p>
              {typeof user.unpaidCommission === "number" && (
                <p className="text-sm text-stone-500">
                  Current unpaid commission: {formatPrice(user.unpaidCommission)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pp-amount" className="text-[16px] text-stone-600">Amount</label>
              <input
                id="pp-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-[16px] py-1 bg-transparent border-2 rounded-md px-1 border-stone-600 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pp-status" className="text-[16px] text-stone-600">Status</label>
              <select
                id="pp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-[16px] py-1 bg-transparent border-2 rounded-md px-1 border-stone-600 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved (settle now)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[16px] text-stone-600">Comment</label>
              <p className="text-[16px] py-2 px-2 border-2 rounded-md border-stone-300 whitespace-pre-wrap">
                {proof.comment || "-"}
              </p>
            </div>
            {proof.proof?.url && (
              <a
                href={proof.proof.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#D6482B] flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-[#b8381e]"
              >
                View Payment Screenshot
              </a>
            )}
            <button
              type="button"
              disabled={submitting}
              className="bg-blue-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-blue-700 disabled:opacity-60"
              onClick={handlePaymentProofUpdate}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="bg-yellow-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-yellow-700"
              onClick={onClose}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
