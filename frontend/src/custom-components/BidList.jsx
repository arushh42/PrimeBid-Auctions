import { formatPrice } from "@/lib/utils";

const rankStyles = ["text-green-600", "text-blue-600", "text-yellow-600"];
const ordinal = (n) => {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
};

/** Shows the bid ranking, or a status image when there's nothing to show. */
const BidList = ({ bidders = [], status }) => {
  if (status === "upcoming") {
    return (
      <img src="/notStarted.png" alt="Auction not started" className="w-full max-h-[650px] object-contain" />
    );
  }
  if (!bidders.length) {
    return status === "ended" ? (
      <img src="/auctionEnded.png" alt="Auction ended" className="w-full max-h-[650px] object-contain" />
    ) : (
      <p className="text-center text-gray-500 py-4">No bids yet. Be the first!</p>
    );
  }
  return (
    <div>
      {status === "ended" && (
        <p className="py-3 text-center text-lg font-semibold text-stone-700">
          Auction ended. Winning bid: {formatPrice(bidders[0].amount)} by {bidders[0].userName}
        </p>
      )}
      {bidders.map((element, index) => (
        <div
          key={element._id || element.userId || index}
          className="py-2 flex items-center justify-between gap-2"
        >
          <div className="flex flex-1 items-center gap-4">
            <img
              src={element.profileImage || "/imageHolder.jpg"}
              alt={element.userName}
              className="w-12 h-12 rounded-full my-2 hidden md:block object-cover"
            />
            <p className="text-[18px] font-semibold">{element.userName}</p>
          </div>
          <p className="flex-1 text-center">{formatPrice(element.amount)}</p>
          <p
            className={`text-[20px] font-semibold flex-1 text-end ${
              rankStyles[index] || "text-gray-600"
            }`}
          >
            {ordinal(index + 1)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default BidList;
