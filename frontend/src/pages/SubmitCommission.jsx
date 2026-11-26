import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { postCommissionProof } from "@/store/slices/commissionSlice";
import { fetchUser } from "@/store/slices/userSlice";
import { formatPrice } from "@/lib/utils";

const MAX_IMAGE_MB = 5;

const SubmitCommission = () => {
  const [proof, setProof] = useState(null);
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const fileInput = useRef(null);
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.commission);
  const { user } = useSelector((state) => state.user);
  const unpaid = user?.unpaidCommission || 0;

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  const proofHandler = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Screenshot must be smaller than ${MAX_IMAGE_MB}MB.`);
      e.target.value = "";
      return;
    }
    setProof(file || null);
  };

  const handlePaymentProof = async (e) => {
    e.preventDefault();
    if (!proof) {
      toast.error("Please attach a screenshot of your payment.");
      return;
    }
    const formData = new FormData();
    formData.append("proof", proof);
    formData.append("amount", amount);
    formData.append("comment", comment);
    const ok = await dispatch(postCommissionProof(formData));
    if (ok) {
      setAmount("");
      setComment("");
      setProof(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-start">
      <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
        <form className="flex flex-col gap-5 w-full" onSubmit={handlePaymentProof}>
          <h3 className="text-[#D6482B] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
            Upload Payment Proof
          </h3>
          <p className={unpaid > 0 ? "text-stone-700" : "text-green-700"}>
            {unpaid > 0
              ? `Your unpaid commission is ${formatPrice(unpaid)}. Pay it to the platform and upload a screenshot of the payment below.`
              : "You have no unpaid commission right now."}
          </p>
          <div className="flex flex-col gap-2">
            <label htmlFor="sc-amount" className="text-[16px] text-stone-500">Amount</label>
            <input
              id="sc-amount"
              type="number"
              required
              min={1}
              max={unpaid || undefined}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sc-proof" className="text-[16px] text-stone-500">
              Payment Proof (screenshot: PNG, JPG or WEBP, max {MAX_IMAGE_MB}MB)
            </label>
            <input
              id="sc-proof"
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={proofHandler}
              className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sc-comment" className="text-[16px] text-stone-500">
              Comment (transaction ID, payment method, etc.)
            </label>
            <textarea
              id="sc-comment"
              required
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={7}
              className="text-[16px] py-2 bg-transparent border-[1px] rounded-md px-1 border-stone-500 focus:outline-none"
            />
          </div>
          <button
            className="bg-[#d6482b] mx-auto font-semibold hover:bg-[#b8381e] text-xl transition-all duration-300 py-2 px-4 rounded-md text-white my-4 disabled:opacity-60"
            type="submit"
            disabled={loading || unpaid <= 0}
          >
            {loading ? "Uploading..." : "Upload Payment Proof"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default SubmitCommission;
