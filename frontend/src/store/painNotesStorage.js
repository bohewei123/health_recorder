export const PAIN_NOTES_STORAGE_KEY = 'health_recorder_pain_notes_v1';

const getHasLocalStorage = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

export const loadPainNotesState = () => {
  if (!getHasLocalStorage()) {
    return { notes: [], selectedNoteId: null };
  }

  try {
    const raw = window.localStorage.getItem(PAIN_NOTES_STORAGE_KEY);
    if (!raw) return { notes: [], selectedNoteId: null };
    const parsed = JSON.parse(raw);
    const notes = Array.isArray(parsed?.notes) ? parsed.notes : [];
    const selectedNoteId = typeof parsed?.selectedNoteId === 'string' ? parsed.selectedNoteId : null;

    return { notes, selectedNoteId };
  } catch {
    return { notes: [], selectedNoteId: null };
  }
};

export const savePainNotesState = (state) => {
  if (!getHasLocalStorage()) return;

  try {
    const payload = {
      notes: Array.isArray(state?.notes) ? state.notes : [],
      selectedNoteId: typeof state?.selectedNoteId === 'string' ? state.selectedNoteId : null,
    };
    window.localStorage.setItem(PAIN_NOTES_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
};

