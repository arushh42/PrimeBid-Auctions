import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { getAuctionDetail } from "./auctionSlice";

const bidSlice = createSlice({
  name: "bid",
  initialState: {
    loading: false,
  },
  reducers: {
    bidRequest(state) {
      state.loading = true;
    },
    bidDone(state) {
      state.loading = false;
    },
  },
});

export const placeBid = (id, amount) => async (dispatch) => {
  dispatch(bidSlice.actions.bidRequest());
  try {
    const response = await api.post(`/bid/place/${id}`, { amount });
    toast.success(response.data.message);
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not place bid."));
    return false;
  } finally {
    dispatch(bidSlice.actions.bidDone());
    dispatch(getAuctionDetail(id, { silent: true }));
  }
};

export default bidSlice.reducer;
