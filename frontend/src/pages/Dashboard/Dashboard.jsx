import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadDashboard } from "@/store/slices/superAdminSlice";
import Spinner from "@/custom-components/Spinner";
import AuctionItemDelete from "./sub-components/AuctionItemDelete";
import BiddersAuctioneersGraph from "./sub-components/BiddersAuctioneersGraph";
import PaymentGraph from "./sub-components/PaymentGraph";
import PaymentProofs from "./sub-components/PaymentProofs";

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-[#111] text-xl font-semibold mb-2 min-[480px]:text-xl md:text-2xl lg:text-3xl">
      {title}
    </h3>
    {children}
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.superAdmin);
  const year = new Date().getFullYear();

  useEffect(() => {
    dispatch(loadDashboard());
  }, [dispatch]);

  if (loading) return <Spinner />;

  return (
    <div className="w-full ml-0 m-0 h-fit px-5 pt-20 pb-10 lg:pl-[320px] flex flex-col gap-10">
      <h1 className="text-[#d6482b] text-2xl font-bold mb-2 min-[480px]:text-4xl md:text-6xl xl:text-7xl 2xl:text-8xl">
        Dashboard
      </h1>
      <div className="flex flex-col gap-10">
        <Section title={`Monthly Commission Received (${year})`}>
          <PaymentGraph />
        </Section>
        <Section title={`New Users (${year})`}>
          <BiddersAuctioneersGraph />
        </Section>
        <Section title="Payment Proofs">
          <PaymentProofs />
        </Section>
        <Section title="Manage Auctions">
          <AuctionItemDelete />
        </Section>
      </div>
    </div>
  );
};

export default Dashboard;
