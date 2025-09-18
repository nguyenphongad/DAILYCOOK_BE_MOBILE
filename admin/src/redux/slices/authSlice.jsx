import { createSlice } from '@reduxjs/toolkit'
import { jwtDecode } from "jwt-decode";
import { loginAdmin } from '../thunks/authThunk';

const getToken = localStorage.getItem("auth_token");

const isValidToken = (token) => {
  try {
    if (!token) return false;
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}


const initialState = {
  user: null,
  token: isValidToken(getToken) ? getToken : null,
  status: null,
  isLogin: isValidToken(getToken)
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null;
      state.isLogin = false;
      localStorage.removeItem("auth_token");
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLogin = true;
        localStorage.setItem("auth_token", action.payload.token);
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })


      // bo sung them check token tra ve thong tin ng dung


  }
})

export const { logout } = authSlice.actions
export default authSlice.reducer
