import { createSlice } from '@reduxjs/toolkit';
import { loadThemeMode } from './themeStorage';

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: loadThemeMode() },
  reducers: {
    setThemeMode: (state, action) => {
      state.mode = action.payload === 'dark' ? 'dark' : 'light';
    },
    toggleThemeMode: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { setThemeMode, toggleThemeMode } = themeSlice.actions;

export default themeSlice.reducer;

