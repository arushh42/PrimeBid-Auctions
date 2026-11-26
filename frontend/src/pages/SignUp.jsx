import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { register } from "@/store/slices/userSlice";

const inputClass =
  "text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-none";
const MAX_IMAGE_MB = 5;

const Field = ({ label, id, className = "sm:flex-1", children }) => (
  <div className={`flex flex-col ${className}`}>
    <label htmlFor={id} className="text-[16px] text-stone-600">
      {label}
    </label>
    {children}
  </div>
);

const SignUp = () => {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    password: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    walletProvider: "",
    walletAccountId: "",
    paypalEmail: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  const { loading, isAuthenticated } = useSelector((state) => state.user);
  const navigateTo = useNavigate();
  const dispatch = useDispatch();
  const isAuctioneer = form.role === "Auctioneer";

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleRegister = (e) => {
    e.preventDefault();
    if (!profileImage) {
      toast.error("Please choose a profile image.");
      return;
    }
    const formData = new FormData();
    const personal = ["userName", "email", "phone", "password", "address", "role"];
    const payment = [
      "bankName",
      "bankAccountNumber",
      "bankAccountName",
      "walletProvider",
      "walletAccountId",
      "paypalEmail",
    ];
    [...personal, ...(isAuctioneer ? payment : [])].forEach((key) =>
      formData.append(key, form[key])
    );
    formData.append("profileImage", profileImage);
    dispatch(register(formData));
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigateTo("/", { replace: true });
    }
  }, [isAuthenticated, navigateTo]);

  const imageHandler = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_MB}MB.`);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setProfileImagePreview(reader.result);
      setProfileImage(file);
    };
  };

  return (
    <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-center">
      <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
        <h1 className="text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl">
          Register
        </h1>
        <form className="flex flex-col gap-5 w-full" onSubmit={handleRegister}>
          <p className="font-semibold text-xl md:text-2xl">Personal Details</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field label="Full Name" id="su-name">
              <input id="su-name" type="text" required minLength={3} maxLength={40}
                autoComplete="name" value={form.userName} onChange={update("userName")} className={inputClass} />
            </Field>
            <Field label="Email" id="su-email">
              <input id="su-email" type="email" required autoComplete="email"
                value={form.email} onChange={update("email")} className={inputClass} />
            </Field>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field label="Phone" id="su-phone">
              <input id="su-phone" type="tel" required pattern="\+?[0-9\s-]{7,20}"
                title="7-15 digits, optionally starting with +" autoComplete="tel"
                value={form.phone} onChange={update("phone")} className={inputClass} />
            </Field>
            <Field label="Address" id="su-address">
              <input id="su-address" type="text" required maxLength={200} autoComplete="street-address"
                value={form.address} onChange={update("address")} className={inputClass} />
            </Field>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Field label="Role" id="su-role">
              <select id="su-role" required value={form.role} onChange={update("role")} className={inputClass}>
                <option value="">Select Role</option>
                <option value="Auctioneer">Auctioneer (I want to sell)</option>
                <option value="Bidder">Bidder (I want to buy)</option>
              </select>
            </Field>
            <Field label="Password (min. 8 characters)" id="su-password">
              <input id="su-password" type="password" required minLength={8} maxLength={72}
                autoComplete="new-password" value={form.password} onChange={update("password")} className={inputClass} />
            </Field>
          </div>
          <div className="flex flex-col sm:flex-1 gap-2">
            <label htmlFor="su-image" className="text-[16px] text-stone-600">
              Profile Image (PNG, JPG or WEBP, max {MAX_IMAGE_MB}MB)
            </label>
            <div className="flex items-center gap-3">
              <img
                src={profileImagePreview || "/imageHolder.jpg"}
                alt="Profile preview"
                className="w-14 h-14 rounded-full object-cover"
              />
              <input id="su-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={imageHandler} />
            </div>
          </div>

          {isAuctioneer && (
            <div className="flex flex-col gap-4">
              <p className="font-semibold text-xl md:text-2xl flex flex-col">
                Payment Details
                <span className="text-[12px] text-stone-500 font-normal">
                  Shared with the winning bidder so they can pay you. Bank details are required.
                </span>
              </p>
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <Field label="Bank Name" id="su-bank">
                  <input id="su-bank" type="text" required value={form.bankName}
                    onChange={update("bankName")} className={inputClass} />
                </Field>
                <Field label="Account Number / IBAN" id="su-acct">
                  <input id="su-acct" type="text" required value={form.bankAccountNumber}
                    onChange={update("bankAccountNumber")} className={inputClass} />
                </Field>
                <Field label="Account Holder Name" id="su-holder">
                  <input id="su-holder" type="text" required value={form.bankAccountName}
                    onChange={update("bankAccountName")} className={inputClass} />
                </Field>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                <Field label="Mobile Wallet (optional)" id="su-wallet-provider">
                  <input id="su-wallet-provider" type="text" placeholder="e.g. UPI, Easypaisa, JazzCash"
                    value={form.walletProvider} onChange={update("walletProvider")} className={inputClass} />
                </Field>
                <Field label="Wallet Number / ID (optional)" id="su-wallet-id">
                  <input id="su-wallet-id" type="text" value={form.walletAccountId}
                    onChange={update("walletAccountId")} className={inputClass} />
                </Field>
                <Field label="PayPal Email (optional)" id="su-paypal">
                  <input id="su-paypal" type="email" value={form.paypalEmail}
                    onChange={update("paypalEmail")} className={inputClass} />
                </Field>
              </div>
            </div>
          )}

          <button
            className="bg-[#d6482b] w-full max-w-[640px] font-semibold hover:bg-[#b8381e] transition-all duration-300 text-xl py-2 px-4 rounded-md text-white mx-auto my-4 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="text-stone-600">
          Already have an account?{" "}
          <Link to="/login" className="text-[#d6482b] font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default SignUp;
