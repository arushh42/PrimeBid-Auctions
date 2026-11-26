import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CardTwo from "@/custom-components/CardTwo";
import Spinner from "@/custom-components/Spinner";
import { getMyAuctionItems } from "@/store/slices/auctionSlice";

const ViewMyAuctions = () => {
  const { myAuctions, loading } = useSelector((state) => state.auction);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMyAuctionItems());
  }, [dispatch]);

  return (
    <div className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col">
      <h1 className="text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl">
        My Auctions
      </h1>
      {loading ? (
        <Spinner />
      ) : myAuctions.length > 0 ? (
        <div className={`${myAuctions.length > 2 ? "flex-grow" : ""} flex flex-wrap gap-6`}>
          {myAuctions.map((element) => (
            <CardTwo
              title={element.title}
              startingBid={element.startingBid}
              endTime={element.endTime}
              startTime={element.startTime}
              imgSrc={element.image?.url}
              id={element._id}
              key={element._id}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4 items-start">
          <h3 className="text-[#666] text-xl font-semibold min-[480px]:text-xl md:text-2xl lg:text-3xl">
            You have not posted any auction.
          </h3>
          <Link
            to="/create-auction"
            className="bg-[#d6482b] font-semibold hover:bg-[#b8381e] rounded-md px-6 py-2 text-white transition-all duration-300"
          >
            Create your first auction
          </Link>
        </div>
      )}
    </div>
  );
};

export default ViewMyAuctions;
