import { Link } from "react-router-dom";
import { useCountdown } from "@/lib/useCountdown";
import { formatPrice } from "@/lib/utils";

const Card = ({ imgSrc, title, startingBid, startTime, endTime, id }) => {
  const timeLeft = useCountdown(startTime, endTime);

  return (
    <Link
      to={`/auction/item/${id}`}
      className="flex-grow basis-full bg-white rounded-md group sm:basis-56 lg:basis-60 2xl:basis-80"
    >
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
      </div>
    </Link>
  );
};

export default Card;
