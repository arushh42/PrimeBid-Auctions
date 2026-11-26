import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { getAllAuctionItems } from "./auctionSlice";

const superAdminSlice = createSlice({
  name: "superAdmin",
  initialState: {
    loading: false,
    submitting: false,
    monthlyRevenue: [],
    totalAuctioneers: [],
    totalBidders: [],
    paymentProofs: [],
    singlePaymentProof: {},
  },
  reducers: {
    loadRequest(state) {
      state.loading = true;
    },
    loadDone(state) {
      state.loading = false;
    },
    submitRequest(state) {
      state.submitting = true;
    },
    submitDone(state) {
      state.submitting = false;
    },
    setMonthlyRevenue(state, action) {
      state.monthlyRevenue = action.payload;
    },
    setUsers(state, action) {
      state.totalAuctioneers = action.payload.auctioneersArray;
      state.totalBidders = action.payload.biddersArray;
    },
    setPaymentProofs(state, action) {
      state.paymentProofs = action.payload;
    },
    setSinglePaymentProof(state, action) {
      state.singlePaymentProof = action.payload;
    },
    clearSinglePaymentProof(state) {
      state.singlePaymentProof = {};
    },
  },
});

const { actions } = superAdminSlice;

export const getMonthlyRevenue = () => async (dispatch) => {
  try {
    const response = await api.get("/superadmin/monthlyincome");
    dispatch(actions.setMonthlyRevenue(response.data.totalMonthlyRevenue));
  } catch (error) {
    dispatch(actions.setMonthlyRevenue([]));
    console.error(getErrorMessage(error));
  }
};

export const getAllUsers = () => async (dispatch) => {
  try {
    const response = await api.get("/superadmin/users/getall");
    dispatch(actions.setUsers(response.data));
  } catch (error) {
    dispatch(actions.setUsers({ auctioneersArray: [], biddersArray: [] }));
    console.error(getErrorMessage(error));
  }
};

export const getAllPaymentProofs = () => async (dispatch) => {
  try {
    const response = await api.get("/superadmin/paymentproofs/getall");
    dispatch(actions.setPaymentProofs(response.data.paymentProofs));
  } catch (error) {
    dispatch(actions.setPaymentProofs([]));
    console.error(getErrorMessage(error));
  }
};

export const loadDashboard = () => async (dispatch) => {
  dispatch(actions.loadRequest());
  await Promise.all([
    dispatch(getMonthlyRevenue()),
    dispatch(getAllUsers()),
    dispatch(getAllPaymentProofs()),
    dispatch(getAllAuctionItems()),
  ]);
  dispatch(actions.loadDone());
};

export const deletePaymentProof = (id) => async (dispatch) => {
  dispatch(actions.submitRequest());
  try {
    const response = await api.delete(`/superadmin/paymentproof/delete/${id}`);
    toast.success(response.data.message);
    dispatch(getAllPaymentProofs());
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not delete payment proof."));
  } finally {
    dispatch(actions.submitDone());
  }
};

export const getSinglePaymentProofDetail = (id) => async (dispatch) => {
  try {
    const response = await api.get(`/superadmin/paymentproof/${id}`);
    dispatch(actions.setSinglePaymentProof(response.data.paymentProofDetail));
  } catch (error) {
    dispatch(actions.clearSinglePaymentProof());
    toast.error(getErrorMessage(error, "Could not load payment proof."));
  }
};

export const clearSinglePaymentProof = () => (dispatch) => {
  dispatch(actions.clearSinglePaymentProof());
};

export const updatePaymentProof = (id, status, amount) => async (dispatch) => {
  dispatch(actions.submitRequest());
  try {
    const response = await api.put(`/superadmin/paymentproof/status/update/${id}`, {
      status,
      amount,
    });
    toast.success(response.data.message);
    dispatch(actions.clearSinglePaymentProof());
    dispatch(getAllPaymentProofs());
    dispatch(getMonthlyRevenue());
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not update payment proof."));
    return false;
  } finally {
    dispatch(actions.submitDone());
  }
};

export const deleteAuctionItem = (id) => async (dispatch) => {
  dispatch(actions.submitRequest());
  try {
    const response = await api.delete(`/superadmin/auctionitem/delete/${id}`);
    toast.success(response.data.message);
    dispatch(getAllAuctionItems());
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not delete auction."));
  } finally {
    dispatch(actions.submitDone());
  }
};

export default superAdminSlice.reducer;
