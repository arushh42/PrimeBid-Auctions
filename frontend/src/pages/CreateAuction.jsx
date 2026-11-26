import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import { createAuction } from "@/store/slices/auctionSlice";
import { fetchUser } from "@/store/slices/userSlice";

const auctionCategories = [
  "Electronics",
  "Furniture",
  "Art & Antiques",
  "Jewelry & Watches",
  "Automobiles",
  "Real Estate",
  "Collectibles",
  "Fashion & Accessories",
  "Sports Memorabilia",
  "Books & Manuscripts",
];
const MAX_IMAGE_MB = 5;
const inputClass =
  "text-[16px] py-2 bg-transparent border-b-[1px] border-b-stone-500 focus:outline-none";

const CreateAuction = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [startingBid, setStartingBid] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const { submitting } = useSelector((state) => state.auction);
  const { user } = useSelector((state) => state.user);
  const hasUnpaidCommission = user?.unpaidCommission > 0;

  // Refresh so the unpaid-commission banner reflects recent settlements.
  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

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
      setImage(file);
      setImagePreview(reader.result);
    };
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    if (!image) return toast.error("Please upload an image of the item.");
    if (!startTime || !endTime) return toast.error("Please choose start and end times.");
    if (startTime <= new Date()) return toast.error("Start time must be in the future.");
    if (endTime <= startTime) return toast.error("End time must be after the start time.");

    const formData = new FormData();
    formData.append("image", image);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("condition", condition);
    formData.append("startingBid", startingBid);
    formData.append("startTime", startTime.toISOString());
    formData.append("endTime", endTime.toISOString());
    const ok = await dispatch(createAuction(formData));
    if (ok) navigateTo("/view-my-auctions");
  };

  return (
    <article className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col">
      <h1 className="text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl">
        Create Auction
      </h1>
      {hasUnpaidCommission && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md p-4 mb-4">
          You have an unpaid commission of Rs. {user.unpaidCommission}. Please{" "}
          <Link to="/submit-commission" className="font-semibold underline">
            submit your payment proof
          </Link>{" "}
          before posting a new auction.
        </div>
      )}
      <div className="bg-white mx-auto w-full h-auto px-2 flex flex-col gap-4 items-center py-4 justify-center rounded-md">
        <form className="flex flex-col gap-5 w-full" onSubmit={handleCreateAuction}>
          <p className="font-semibold text-xl md:text-2xl">Auction Detail</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="ca-title" className="text-[16px] text-stone-600">Title</label>
              <input id="ca-title" type="text" required maxLength={120} value={title}
                onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="ca-category" className="text-[16px] text-stone-600">Category</label>
              <select id="ca-category" required value={category}
                onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="">Select Category</option>
                {auctionCategories.map((element) => (
                  <option key={element} value={element}>
                    {element}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="ca-condition" className="text-[16px] text-stone-600">Condition</label>
              <select id="ca-condition" required value={condition}
                onChange={(e) => setCondition(e.target.value)} className={inputClass}>
                <option value="">Select Condition</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="ca-bid" className="text-[16px] text-stone-600">Starting Bid (Rs.)</label>
              <input id="ca-bid" type="number" required min={1} step="1" value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label htmlFor="ca-description" className="text-[16px] text-stone-600">Description</label>
              <textarea id="ca-description" required maxLength={5000} value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-[16px] py-2 bg-transparent border-2 border-stone-500 focus:outline-none px-2 rounded-md"
                rows={10} />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col sm:flex-1">
              <label className="text-[16px] text-stone-600">Auction Starting Time</label>
              <DatePicker
                selected={startTime}
                onChange={setStartTime}
                minDate={new Date()}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start time"
                className={`${inputClass} w-full`}
              />
            </div>
            <div className="flex flex-col sm:flex-1">
              <label className="text-[16px] text-stone-600">Auction End Time</label>
              <DatePicker
                selected={endTime}
                onChange={setEndTime}
                minDate={startTime || new Date()}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end time"
                className={`${inputClass} w-full`}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <label className="font-semibold text-xl md:text-2xl">Auction Item Image</label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {imagePreview ? (
                    <img src={imagePreview} alt={title || "Preview"} className="w-44 h-auto" />
                  ) : (
                    <svg
                      className="w-8 h-8 mb-4 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                  )}
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span>
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or WEBP (max {MAX_IMAGE_MB}MB)</p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={imageHandler}
                />
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || hasUnpaidCommission}
            className="bg-[#D6482B] font-semibold hover:bg-[#b8381e] text-xl transition-all duration-300 py-2 px-4 rounded-md text-white w-full max-w-[640px] mx-auto my-4 disabled:opacity-60"
          >
            {submitting ? "Creating Auction..." : "Create Auction"}
          </button>
        </form>
      </div>
    </article>
  );
};

export default CreateAuction;
