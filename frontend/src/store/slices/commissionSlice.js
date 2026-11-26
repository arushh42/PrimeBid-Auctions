import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";

const commissionSlice = createSlice({
  name: "commission",
  initialState: {
    loading: false,
  },
  reducers: {
    request(state) {
      state.loading = true;
    },
    done(state) {
      state.loading = false;
    },
  },
});

export const postCommissionProof = (data) => async (dispatch) => {
  dispatch(commissionSlice.actions.request());
  try {
    const response = await api.post("/commission/proof", data);
    toast.success(response.data.message);
    return true;
  } catch (error) {
    toast.error(getErrorMessage(error, "Could not submit payment proof."));
    return false;
  } finally {
    dispatch(commissionSlice.actions.done());
  }
};

export default commissionSlice.reducer;
