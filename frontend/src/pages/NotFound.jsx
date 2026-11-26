import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <section className="w-full ml-0 m-0 h-fit px-5 pt-20 lg:pl-[320px] flex flex-col min-h-screen py-4 justify-center items-center text-center gap-4">
      <h1 className="text-[#d6482b] text-6xl font-bold">404</h1>
      <p className="text-xl text-stone-600">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="bg-[#d6482b] font-semibold hover:bg-[#b8381e] rounded-md px-8 py-2 text-white transition-all duration-300"
      >
        Back to Home
      </Link>
    </section>
  );
};

export default NotFound;
