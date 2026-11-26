import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";

const auctionSlice = createSlice({
  name: "auction",
  initialState: {
    loading: false, // list fetches
    detailLoading: false, // single auction fetch
    detailError: false,
    submitting: false, // create / republish / delete
    auctionDetail: {},
    auctionBidders: [],
    myAuctions: [],
    allAuctions: [],
  },
  reducers: {
    fetchRequest(state) {
      state.loading = true;
    },
    fetchDone(state) {
      state.loading = false;
    },
    submitRequest(state) {
      state.submitting = true;
    },
    submitDone(state) {
      state.submitting = false;
    },
    setAllAuctions(state, action) {
      state.loading = false;
      state.allAuctions = action.payload;
    },
    detailRequest(state) {
      state.detailLoading = true;
      state.detailError = false;
    },
    detailFailed(state) {
      state.detailLoading = false;
      state.detailError = true;
    },
    setAuctionDetail(state, action) {
      state.detailLoading = false;
      state.auctionDetail = action.payload.auctionItem;
      state.auctionBidders = action.payload.bidders;
    },
    clearAuctionDetail(state) {
      state.auctionDetail = {};
      state.auctionBidders = [];
    },
    setMyAuctions(state, action) {
      state.loading = false;
      state.myAuctions = action.payload;
    },
  },
});

const { actions } = auctionSlice;

export const getAllAuctionItems = () => async (dispatch) => {
  dispatch(actions.fetchRequest());
  try {
    const response = await api.get("/auctionitem/allitems");
    dispatch(actions.setAllAuctions(response.data.items));
  } catch (error) {
    dispatch(actions.fetchDone());
    console.error(getErrorMessage(error));
  }
};

export const getMyAuctionItems = () => async (dispatch) => {
  dispatch(actions.fetchRequest());
  try {
    const response = await api.get("/auctionitem/myitems");
    dispatch(actions.setMyAuctions(response.data.items));
  } catch (error) {
    dispatch(actions.setMyAuctions([]));
    toast.error(getErrorMessage(error, "Could not load your auctions."));
  }
};

/** silent=true refreshes without showing the full-page spinner. */
export const getAuctionDetail =
  (id, { silent = false } = {}) =>
  async (dispatch) => {
    if (!silent) {
      dispatch(actions.clearAuctionDetail());
      dispatch(actions.detailRequest());
    }
    try {
      const response = await api.get(`/auctionitem/auction/${id}`);
      dispatch(actions.setAuctionDetail(response.data));
    } catch (error) {
      if (!silent) dispatch(actions.detailFailed());
      if (!silent) toast.error(getErrorMessage(error, "Could not load auction."));
    }
  };

export const createAuction = (data) => async (dispatch) => {
  dispatch(actions.submitRequest());
  try {
    const response = await api.post("/auctionitem/create", data);
    toast.success(response.data.message);
    dispatch(getAllAuctionItems());
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not create auction."));
    return false;
  } finally {
    dispatch(actions.submitDone());
  }
};

export const republishAuction = (id, data) => async (dispatch) => {
  dispatch(actions.submitRequest());
  try {
    const response = await api.put(`/auctionitem/item/republish/${id}`, data);
    toast.success(response.data.message);
    dispatch(getMyAuctionItems());
    dispatch(getAllAuctionItems());
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not republish auction."));
    return false;
  } finally {
    dispatch(actions.submitDone());
  }
};

export const deleteAuction = (id) => async (dispatch) => {
  dispatch(actions.submitRequest());
  try {
    const response = await api.delete(`/auctionitem/delete/${id}`);
    toast.success(response.data.message);
    dispatch(getMyAuctionItems());
    dispatch(getAllAuctionItems());
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not delete auction."));
    return false;
  } finally {
    dispatch(actions.submitDone());
  }
};

export default auctionSlice.reducer;
