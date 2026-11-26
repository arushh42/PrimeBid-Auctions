import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDispatch } from "react-redux";
import SideDrawer from "./layout/SideDrawer";
import Spinner from "./custom-components/Spinner";
import ProtectedRoute from "./custom-components/ProtectedRoute";
import ScrollToTop from "./custom-components/ScrollToTop";
import { fetchLeaderboard, fetchUser } from "./store/slices/userSlice";
import { getAllAuctionItems } from "./store/slices/auctionSlice";

const Home = lazy(() => import("./pages/Home"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Login = lazy(() => import("./pages/Login"));
const SubmitCommission = lazy(() => import("./pages/SubmitCommission"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const About = lazy(() => import("./pages/About"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Auctions = lazy(() => import("./pages/Auctions"));
const AuctionItem = lazy(() => import("./pages/AuctionItem"));
const CreateAuction = lazy(() => import("./pages/CreateAuction"));
const ViewMyAuctions = lazy(() => import("./pages/ViewMyAuctions"));
const ViewAuctionDetails = lazy(() => import("./pages/ViewAuctionDetails"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchUser());
    dispatch(getAllAuctionItems());
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  return (
    <Router>
      <ScrollToTop />
      <SideDrawer />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/how-it-works-info" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auction/item/:id" element={<AuctionItem />} />
          <Route path="/contact" element={<Contact />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/me" element={<UserProfile />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Auctioneer"]} />}>
            <Route path="/submit-commission" element={<SubmitCommission />} />
            <Route path="/create-auction" element={<CreateAuction />} />
            <Route path="/view-my-auctions" element={<ViewMyAuctions />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Auctioneer", "Super Admin"]} />}>
            <Route path="/auction/details/:id" element={<ViewAuctionDetails />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Super Admin"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ToastContainer position="top-right" />
    </Router>
  );
};

export default App;
