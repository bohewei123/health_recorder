import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

const normalizeTimeOfDay = (v) => {
  if (v === '早起时') return '起床';
  if (v === '中午') return '下午';
  return v;
};

export const fetchRecords = createAsyncThunk('records/fetchRecords', async () => {
  const response = await api.get('/records');
  return response.data.map((r) => ({ ...r, time_of_day: normalizeTimeOfDay(r.time_of_day) }));
});

export const addRecord = createAsyncThunk('records/addRecord', async (record) => {
  const response = await api.post('/records', record);
  return response.data;
});

export const deleteRecord = createAsyncThunk('records/deleteRecord', async (id) => {
  await api.delete(`/records/${id}`);
  return id;
});

const recordsSlice = createSlice({
  name: 'records',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addRecord.fulfilled, (state, action) => {
        const targetDate = action.payload.date;
        const targetTime = normalizeTimeOfDay(action.payload.time_of_day);
        const index = state.items.findIndex(r => r.date === targetDate && normalizeTimeOfDay(r.time_of_day) === targetTime);
        if (index !== -1) {
            state.items[index] = { ...action.payload, time_of_day: targetTime };
        } else {
            state.items.push({ ...action.payload, time_of_day: targetTime });
        }
      })
      .addCase(deleteRecord.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default recordsSlice.reducer;
