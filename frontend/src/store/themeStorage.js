export const THEME_MODE_STORAGE_KEY = 'health_recorder_theme_mode_v1';

const getHasLocalStorage = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

export const loadThemeMode = () => {
  if (!getHasLocalStorage()) return 'light';
  try {
    const raw = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const saveThemeMode = (mode) => {
  if (!getHasLocalStorage()) return;
  try {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode === 'dark' ? 'dark' : 'light');
  } catch {
    return;
  }
};

