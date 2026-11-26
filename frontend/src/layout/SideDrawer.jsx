import { useState } from "react";
import { RiAuctionFill } from "react-icons/ri";
import { MdLeaderboard, MdDashboard } from "react-icons/md";
import { SiGooglesearchconsole } from "react-icons/si";
import { BsFillInfoSquareFill } from "react-icons/bs";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdCloseCircleOutline, IoIosCreate } from "react-icons/io";
import { FaUserCircle, FaEye } from "react-icons/fa";
import { FaFileInvoiceDollar } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "@/store/slices/userSlice";

const linkClass =
  "flex text-xl font-semibold gap-2 items-center hover:text-[#D6482b] hover:transition-all hover:duration-150";

const SideDrawer = () => {
  const [show, setShow] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigateTo = useNavigate();
  const close = () => setShow(false);

  const handleLogout = async () => {
    close();
    await dispatch(logout());
    navigateTo("/");
  };

  const NavItem = ({ to, icon: Icon, children }) => (
    <li>
      <Link to={to} onClick={close} className={linkClass}>
        <Icon /> {children}
      </Link>
    </li>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setShow(!show)}
        className="fixed right-5 top-5 z-40 bg-[#D6482B] text-white text-3xl p-2 rounded-md hover:bg-[#b8381e] lg:hidden"
      >
        <GiHamburgerMenu />
      </button>
      <nav
        className={`w-[100%] sm:w-[300px] bg-[#f6f4f0] h-full fixed top-0 z-40 overflow-y-auto ${
          show ? "left-0" : "left-[-100%]"
        } transition-all duration-100 p-4 flex flex-col justify-between lg:left-0 border-r-[1px] border-r-stone-500`}
      >
        <div className="relative">
          <Link to={"/"} onClick={close}>
            <h4 className="text-2xl font-semibold mb-4">
              Prime<span className="text-[#D6482b]">Bid</span>
            </h4>
          </Link>
          <ul className="flex flex-col gap-3">
            <NavItem to="/auctions" icon={RiAuctionFill}>
              Auctions
            </NavItem>
            <NavItem to="/leaderboard" icon={MdLeaderboard}>
              Leaderboard
            </NavItem>
            {isAuthenticated && user?.role === "Auctioneer" && (
              <>
                <NavItem to="/submit-commission" icon={FaFileInvoiceDollar}>
                  Submit Commission
                </NavItem>
                <NavItem to="/create-auction" icon={IoIosCreate}>
                  Create Auction
                </NavItem>
                <NavItem to="/view-my-auctions" icon={FaEye}>
                  View My Auctions
                </NavItem>
              </>
            )}
            {isAuthenticated && user?.role === "Super Admin" && (
              <NavItem to="/dashboard" icon={MdDashboard}>
                Dashboard
              </NavItem>
            )}
          </ul>
          {!isAuthenticated ? (
            <div className="my-4 flex gap-2">
              <Link
                to={"/sign-up"}
                onClick={close}
                className="bg-[#D6482B] font-semibold hover:bg-[#b8381e] text-xl py-1 px-4 rounded-md text-white"
              >
                Sign Up
              </Link>
              <Link
                to={"/login"}
                onClick={close}
                className="text-[#DECCBE] bg-transparent border-[#DECCBE] border-2 hover:bg-[#fffefd] hover:text-[#fdba88] font-bold text-xl py-1 px-4 rounded-md"
              >
                Login
              </Link>
            </div>
          ) : (
            <div className="my-4 flex gap-4 w-fit">
              <button
                type="button"
                onClick={handleLogout}
                className="bg-[#D6482B] font-semibold hover:bg-[#b8381e] text-xl py-1 px-4 rounded-md text-white"
              >
                Logout
              </button>
            </div>
          )}
          <hr className="mb-4 border-t-[#d6482b]" />
          <ul className="flex flex-col gap-3">
            {isAuthenticated && (
              <NavItem to="/me" icon={FaUserCircle}>
                Profile
              </NavItem>
            )}
            <NavItem to="/how-it-works-info" icon={SiGooglesearchconsole}>
              How it works
            </NavItem>
            <NavItem to="/about" icon={BsFillInfoSquareFill}>
              About Us
            </NavItem>
          </ul>
          <IoMdCloseCircleOutline
            aria-label="Close menu"
            onClick={close}
            className="absolute top-0 right-4 text-[28px] cursor-pointer sm:hidden"
          />
        </div>

        <div className="mt-6">
          <Link
            to={"/contact"}
            onClick={close}
            className="text-stone-500 font-semibold hover:text-[#d6482b] hover:transition-all hover:duration-150"
          >
            Contact Us
          </Link>
          <p className="text-stone-500">
            &copy; {new Date().getFullYear()} PrimeBid
          </p>
        </div>
      </nav>
    </>
  );
};

export default SideDrawer;
