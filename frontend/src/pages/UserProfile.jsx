import { useSelector } from "react-redux";
import { formatPrice } from "@/lib/utils";

const ReadOnly = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="text"
      value={value ?? ""}
      readOnly
      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none bg-stone-50"
    />
  </div>
);

const UserProfile = () => {
  const { user } = useSelector((state) => state.user);
  const pm = user.paymentMethods || {};

  return (
    <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-start">
      <div className="bg-white mx-auto w-full h-auto px-4 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
        <img
          src={user.profileImage?.url || "/imageHolder.jpg"}
          alt={user.userName}
          className="w-36 h-36 rounded-full object-cover"
        />

        <div className="mb-6 w-full">
          <h3 className="text-xl font-semibold mb-4">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnly label="Name" value={user.userName} />
            <ReadOnly label="Email" value={user.email} />
            <ReadOnly label="Phone" value={user.phone} />
            <ReadOnly label="Address" value={user.address} />
            <ReadOnly label="Role" value={user.role} />
            <ReadOnly
              label="Joined On"
              value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
            />
          </div>
        </div>

        {user.role === "Auctioneer" && (
          <div className="mb-6 w-full">
            <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnly label="Bank Name" value={pm.bankTransfer?.bankName} />
              <ReadOnly label="Account Number / IBAN" value={pm.bankTransfer?.bankAccountNumber} />
              <ReadOnly label="Account Holder Name" value={pm.bankTransfer?.bankAccountName} />
              <ReadOnly
                label={pm.wallet?.provider ? `${pm.wallet.provider} Wallet` : "Mobile Wallet"}
                value={pm.wallet?.accountId || "-"}
              />
              <ReadOnly label="PayPal Email" value={pm.paypal?.paypalEmail || "-"} />
            </div>
          </div>
        )}

        {user.role !== "Super Admin" && (
          <div className="mb-6 w-full">
            <h3 className="text-xl font-semibold mb-4">Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.role === "Auctioneer" && (
                <ReadOnly label="Unpaid Commission" value={formatPrice(user.unpaidCommission)} />
              )}
              {user.role === "Bidder" && (
                <>
                  <ReadOnly label="Auctions Won" value={user.auctionsWon} />
                  <ReadOnly label="Money Spent" value={formatPrice(user.moneySpent)} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserProfile;
