import { createSlice, nanoid } from '@reduxjs/toolkit';
import { loadPainNotesState } from './painNotesStorage';

const initialState = loadPainNotesState();

const painNotesSlice = createSlice({
  name: 'painNotes',
  initialState,
  reducers: {
    createNote: {
      reducer: (state, action) => {
        state.notes.unshift(action.payload);
        state.selectedNoteId = action.payload.id;
      },
      prepare: ({ content }) => {
        const now = new Date().toISOString();
        return {
          payload: {
            id: nanoid(),
            content,
            createdAt: now,
            updatedAt: now,
          },
        };
      },
    },
    updateNoteContent: (state, action) => {
      const { id, content } = action.payload;
      const target = state.notes.find((n) => n.id === id);
      if (!target) return;
      target.content = content;
      target.updatedAt = new Date().toISOString();
    },
    deleteNote: (state, action) => {
      const id = action.payload;
      state.notes = state.notes.filter((n) => n.id !== id);
      if (state.selectedNoteId === id) {
        state.selectedNoteId = state.notes[0]?.id ?? null;
      }
    },
    selectNote: (state, action) => {
      state.selectedNoteId = action.payload;
    },
  },
});

export const { createNote, updateNoteContent, deleteNote, selectNote } = painNotesSlice.actions;

export default painNotesSlice.reducer;

