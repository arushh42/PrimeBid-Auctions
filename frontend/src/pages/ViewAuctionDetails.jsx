import { useEffect } from "react";
import { FaGreaterThan } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import Spinner from "@/custom-components/Spinner";
import BidList from "@/custom-components/BidList";
import { getAuctionDetail } from "@/store/slices/auctionSlice";
import { useCountdown } from "@/lib/useCountdown";
import { formatDateTime, formatPrice } from "@/lib/utils";

const ViewAuctionDetails = () => {
  const { id } = useParams();
  const { detailLoading, detailError, auctionDetail, auctionBidders } = useSelector(
    (state) => state.auction
  );
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const countdown = useCountdown(auctionDetail.startTime, auctionDetail.endTime);
  const isAdmin = user?.role === "Super Admin";

  useEffect(() => {
    if (id) dispatch(getAuctionDetail(id));
  }, [dispatch, id]);

  return (
    <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col">
      <div className="text-[16px] flex flex-wrap gap-2 items-center">
        <Link to="/" className="font-semibold transition-all duration-300 hover:text-[#D6482B]">
          Home
        </Link>
        <FaGreaterThan className="text-stone-400" />
        <Link
          to={isAdmin ? "/dashboard" : "/view-my-auctions"}
          className="font-semibold transition-all duration-300 hover:text-[#D6482B]"
        >
          {isAdmin ? "Dashboard" : "My Auctions"}
        </Link>
        <FaGreaterThan className="text-stone-400" />
        <p className="text-stone-600">{auctionDetail.title}</p>
      </div>
      {detailError ? (
        <p className="text-xl text-stone-600 py-10">This auction could not be found.</p>
      ) : detailLoading || auctionDetail._id !== id ? (
        <Spinner />
      ) : (
        <div className="flex gap-4 flex-col 2xl:flex-row">
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex gap-4 flex-col lg:flex-row">
              <div className="bg-white w-[100%] lg:w-40 lg:h-40 flex justify-center items-center p-5">
                <img src={auctionDetail.image?.url} alt={auctionDetail.title} className="object-contain max-h-full" />
              </div>
              <div className="flex flex-col justify-around pb-4 gap-1">
                <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
                  {auctionDetail.title}
                </h3>
                <p className="text-xl font-semibold">
                  Condition: <span className="text-[#D6482B]">{auctionDetail.condition}</span>
                </p>
                <p className="text-xl font-semibold">
                  Minimum Bid:{" "}
                  <span className="text-[#D6482B]">{formatPrice(auctionDetail.startingBid)}</span>
                </p>
                <p className="text-stone-600">
                  {countdown.label} <span className="font-semibold">{countdown.text}</span>
                </p>
                <p className="text-sm text-stone-500">
                  {formatDateTime(auctionDetail.startTime)} - {formatDateTime(auctionDetail.endTime)}
                </p>
                {countdown.status === "ended" && auctionDetail.commissionAmount > 0 && (
                  <p className="text-sm text-stone-600">
                    Platform commission: {formatPrice(auctionDetail.commissionAmount)}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xl w-fit font-bold">Auction Item Description</p>
            <hr className="my-2 border-t-[1px] border-t-stone-700" />
            <ul className="list-disc pl-5">
              {auctionDetail.description?.split(". ").map((element, index) => (
                <li key={index} className="text-[18px] my-2">
                  {element}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1">
            <header className="bg-stone-200 py-4 text-[24px] font-semibold px-4">BIDS</header>
            <div className="bg-white px-4 min-h-fit lg:min-h-[650px]">
              <BidList bidders={auctionBidders} status={countdown.status} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ViewAuctionDetails;
