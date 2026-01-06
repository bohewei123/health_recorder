import { configureStore } from '@reduxjs/toolkit';
import recordsReducer from './recordsSlice';
import exercisesReducer from './exercisesSlice';

export const store = configureStore({
  reducer: {
    records: recordsReducer,
    exercises: exercisesReducer,
  },
});
