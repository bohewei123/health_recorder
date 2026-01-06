import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchRecords = createAsyncThunk('records/fetchRecords', async () => {
  const response = await api.get('/records');
  return response.data;
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
        const index = state.items.findIndex(r => r.date === action.payload.date && r.time_of_day === action.payload.time_of_day);
        if (index !== -1) {
            state.items[index] = action.payload;
        } else {
            state.items.push(action.payload);
        }
      })
      .addCase(deleteRecord.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default recordsSlice.reducer;
