// src/api/config.js
const API_BASE_URL = import.meta.env.VITE_CIMS_API_BASE || 'http://localhost:50050';
const CMD_BASE_URL = import.meta.env.VITE_CIMS_CMD_BASE || 'http://localhost:50052';

export { API_BASE_URL, CMD_BASE_URL };
