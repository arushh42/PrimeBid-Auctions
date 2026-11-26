import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    // false until the initial "who am I?" request finishes, so protected
    // pages don't redirect before we know whether the user is logged in.
    authChecked: false,
    isAuthenticated: false,
    user: {},
    leaderboard: [],
    leaderboardLoading: false,
  },
  reducers: {
    authRequest(state) {
      state.loading = true;
    },
    authSuccess(state, action) {
      state.loading = false;
      state.authChecked = true;
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    authFailed(state) {
      state.loading = false;
      state.authChecked = true;
      state.isAuthenticated = false;
      state.user = {};
    },
    formFailed(state) {
      state.loading = false;
    },
    loggedOut(state) {
      state.isAuthenticated = false;
      state.user = {};
    },
    fetchLeaderboardRequest(state) {
      state.leaderboardLoading = true;
    },
    fetchLeaderboardSuccess(state, action) {
      state.leaderboardLoading = false;
      state.leaderboard = action.payload;
    },
    fetchLeaderboardFailed(state) {
      state.leaderboardLoading = false;
      state.leaderboard = [];
    },
  },
});

const { actions } = userSlice;

export const register = (data) => async (dispatch) => {
  dispatch(actions.authRequest());
  try {
    const response = await api.post("/user/register", data);
    dispatch(actions.authSuccess(response.data.user));
    toast.success(response.data.message);
    return true;
  } catch (error) {
    dispatch(actions.formFailed());
    toast.error(getErrorMessage(error, "Registration failed."));
    return false;
  }
};

export const login = (data) => async (dispatch) => {
  dispatch(actions.authRequest());
  try {
    const response = await api.post("/user/login", data);
    dispatch(actions.authSuccess(response.data.user));
    toast.success(response.data.message);
    return true;
  } catch (error) {
    dispatch(actions.formFailed());
    toast.error(getErrorMessage(error, "Login failed."));
    return false;
  }
};

export const logout = () => async (dispatch) => {
  try {
    const response = await api.post("/user/logout");
    toast.success(response.data.message);
  } catch (error) {
    toast.error(getErrorMessage(error, "Logout failed."));
  } finally {
    dispatch(actions.loggedOut());
  }
};

export const fetchUser = () => async (dispatch) => {
  try {
    const response = await api.get("/user/me");
    dispatch(actions.authSuccess(response.data.user));
  } catch {
    dispatch(actions.authFailed());
  }
};

export const fetchLeaderboard = () => async (dispatch) => {
  dispatch(actions.fetchLeaderboardRequest());
  try {
    const response = await api.get("/user/leaderboard");
    dispatch(actions.fetchLeaderboardSuccess(response.data.leaderboard));
  } catch (error) {
    dispatch(actions.fetchLeaderboardFailed());
    console.error(getErrorMessage(error));
  }
};

export default userSlice.reducer;
