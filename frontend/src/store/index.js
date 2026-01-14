import { configureStore } from '@reduxjs/toolkit';
import recordsReducer from './recordsSlice';
import exercisesReducer from './exercisesSlice';
import painNotesReducer from './painNotesSlice';
import { savePainNotesState } from './painNotesStorage';
import themeReducer from './themeSlice';
import { saveThemeMode } from './themeStorage';

export const store = configureStore({
  reducer: {
    records: recordsReducer,
    exercises: exercisesReducer,
    painNotes: painNotesReducer,
    theme: themeReducer,
  },
});

let painNotesSaveTimer = null;

store.subscribe(() => {
  if (painNotesSaveTimer) clearTimeout(painNotesSaveTimer);
  painNotesSaveTimer = setTimeout(() => {
    const state = store.getState();
    savePainNotesState(state.painNotes);
    saveThemeMode(state.theme.mode);
  }, 500);
});
