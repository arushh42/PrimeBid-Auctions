import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { deleteAuction, republishAuction } from "@/store/slices/auctionSlice";
import { useCountdown } from "@/lib/useCountdown";
import { formatPrice } from "@/lib/utils";

const CardTwo = ({ imgSrc, title, startingBid, startTime, endTime, id }) => {
  const timeLeft = useCountdown(startTime, endTime);
  const { submitting } = useSelector((state) => state.auction);
  const dispatch = useDispatch();
  const [openDrawer, setOpenDrawer] = useState(false);
  const ended = timeLeft.status === "ended";

  const handleDeleteAuction = () => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      dispatch(deleteAuction(id));
    }
  };

  return (
    <>
      <div className="basis-full bg-white rounded-md group sm:basis-56 lg:basis-60 2xl:basis-80">
        <img
          src={imgSrc || "/imageHolder.jpg"}
          alt={title}
          loading="lazy"
          className="w-full aspect-[4/3] m-auto md:p-12 object-contain"
        />
        <div className="px-2 pt-4 pb-2">
          <h5 className="font-semibold text-[18px] group-hover:text-[#d6482b] mb-2">
            {title}
          </h5>
          {startingBid ? (
            <p className="text-stone-600 font-light">
              Starting Bid:{" "}
              <span className="text-[#fdba88] font-bold ml-1">
                {formatPrice(startingBid)}
              </span>
            </p>
          ) : null}
          <p className="text-stone-600 font-light">
            {timeLeft.label}
            <span className="text-[#fdba88] font-bold ml-1">{timeLeft.text}</span>
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <Link
              className="bg-stone-700 text-center text-white text-xl px-4 py-2 rounded-md transition-all duration-300 hover:bg-black"
              to={`/auction/details/${id}`}
            >
              View Auction
            </Link>
            <button
              className="bg-red-400 text-center text-white text-xl px-4 py-2 rounded-md transition-all duration-300 hover:bg-red-600 disabled:opacity-60"
              onClick={handleDeleteAuction}
              disabled={submitting}
            >
              Delete Auction
            </button>
            <button
              disabled={!ended}
              title={ended ? "" : "You can republish once the auction has ended"}
              onClick={() => setOpenDrawer(true)}
              className="bg-sky-400 text-center text-white text-xl px-4 py-2 rounded-md transition-all duration-300 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-400"
            >
              Republish Auction
            </button>
          </div>
        </div>
      </div>
      {openDrawer && <Drawer id={id} setOpenDrawer={setOpenDrawer} />}
    </>
  );
};

export default CardTwo;

const Drawer = ({ setOpenDrawer, id }) => {
  const dispatch = useDispatch();
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const { submitting } = useSelector((state) => state.auction);

  const handleRepublishAuction = async () => {
    if (!startTime || !endTime) return;
    const ok = await dispatch(
      republishAuction(id, {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      })
    );
    if (ok) setOpenDrawer(false);
  };

  return (
    <section className="fixed bottom-0 left-0 w-full h-full bg-[#00000087] flex items-end z-50">
      <div className="bg-white h-fit w-full">
        <div className="w-full px-5 py-8 sm:max-w-[640px] sm:m-auto">
          <h3 className="text-[#D6482B] text-3xl font-semibold text-center mb-1">
            Republish Auction
          </h3>
          <p className="text-stone-600">
            Republish this auction with the same details but a new start and end
            time.
          </p>
          <form className="flex flex-col gap-5 my-5">
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600">
                Republish Auction Start Time
              </label>
              <DatePicker
                selected={startTime}
                onChange={setStartTime}
                minDate={new Date()}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start time"
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-none w-full"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[16px] text-stone-600">
                Republish Auction End Time
              </label>
              <DatePicker
                selected={endTime}
                onChange={setEndTime}
                minDate={startTime || new Date()}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end time"
                className="text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-none w-full"
              />
            </div>
            <button
              type="button"
              disabled={submitting || !startTime || !endTime}
              className="bg-blue-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-blue-700 disabled:opacity-60"
              onClick={handleRepublishAuction}
            >
              {submitting ? "Republishing..." : "Republish"}
            </button>
            <button
              type="button"
              className="bg-yellow-500 flex justify-center w-full py-2 rounded-md text-white font-semibold text-xl transition-all duration-300 hover:bg-yellow-700"
              onClick={() => setOpenDrawer(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
