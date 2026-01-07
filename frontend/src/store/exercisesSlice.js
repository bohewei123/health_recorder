import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchExerciseConfig = createAsyncThunk('exercises/fetchConfig', async () => {
  const response = await api.get('/exercises/config');
  return response.data;
});

export const updateExerciseConfig = createAsyncThunk('exercises/updateConfig', async (config) => {
  const response = await api.post('/exercises/config', config);
  return response.data;
});

export const fetchExerciseLogs = createAsyncThunk('exercises/fetchLogs', async () => {
  const response = await api.get('/exercises/logs');
  return response.data;
});

export const saveExerciseLog = createAsyncThunk('exercises/saveLog', async ({ date, data }) => {
  const response = await api.post(`/exercises/logs/${date}`, data);
  return response.data;
});

export const exportExerciseLogs = createAsyncThunk('exercises/export', async ({ startDate, endDate }) => {
    const response = await api.get('/exercises/export', {
        params: { start_date: startDate, end_date: endDate },
        responseType: 'blob' // Important for file download
    });
    return response.data;
});

const exercisesSlice = createSlice({
  name: 'exercises',
  initialState: {
    config: [],
    logs: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExerciseConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      .addCase(updateExerciseConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      })
      .addCase(fetchExerciseLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
      })
      .addCase(saveExerciseLog.fulfilled, (state, action) => {
        const index = state.logs.findIndex(l => l.date === action.payload.date);
        if (index !== -1) {
            state.logs[index] = action.payload;
        } else {
            state.logs.push(action.payload);
        }
      });
  },
});

export default exercisesSlice.reducer;
