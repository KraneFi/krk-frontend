// Mode switch. `mock` keeps the original generated dataset for every page;
// `live` calls the API for the pages that are wired (Users, Compliance) and
// still falls back to generated data for the ones that are not.
export const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'live'
export const LIVE = DATA_MODE !== 'mock'
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001'
