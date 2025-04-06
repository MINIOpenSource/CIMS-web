// src/api/index.js
import axios from 'axios';
import { API_BASE_URL, CMD_BASE_URL } from './config';
import { useAppStore } from '@/store/app';

const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });
const cmdClient = axios.create({ baseURL: CMD_BASE_URL, timeout: 10000 });

const requestInterceptor = (config) => { const appStore = useAppStore(); appStore.setLoading(true); return config; };
const responseInterceptor = (response) => { const appStore = useAppStore(); appStore.setLoading(false); return response; };
const errorInterceptor = (error) => { const appStore = useAppStore(); appStore.setLoading(false); appStore.setError(error.response?.data?.detail || error.message || 'API Error'); return Promise.reject(error); };

apiClient.interceptors.request.use(requestInterceptor); apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);
cmdClient.interceptors.request.use(requestInterceptor); cmdClient.interceptors.response.use(responseInterceptor, errorInterceptor);

export const getManifest = (clientUid) => apiClient.get(`/api/v1/client/${clientUid}/manifest`);
export const getConfigResource = (resourceType, name) => apiClient.get(`/api/v1/client/${resourceType}`, { params: { name } });

export const listConfigFiles = (resourceType) => cmdClient.get(`/command/datas/${resourceType}/list`);
export const createConfigFile = (resourceType, name) => cmdClient.get(`/command/datas/${resourceType}/create`, { params: { name } });
export const deleteConfigFile = (resourceType, name) => cmdClient.delete(`/command/datas/${resourceType}/delete`, { params: { name } });
export const renameConfigFile = (resourceType, name, target) => cmdClient.put(`/command/datas/${resourceType}/rename`, null, { params: { name, target } });
export const writeConfigFile = (resourceType, name, data) => cmdClient.put(`/command/datas/${resourceType}/write?name=${name}`, data, { headers: { 'Content-Type': 'application/json' } });
export const getServerSettings = () => cmdClient.get('/command/server/settings');
export const updateServerSettings = (settings) => cmdClient.put('/command/server/settings', settings);
export const listClients = () => cmdClient.get('/command/clients/list');
export const listClientStatus = () => cmdClient.get('/command/clients/status');
export const getClientDetails = (clientUid) => cmdClient.get(`/command/client/${clientUid}/details`);
export const preRegisterClient = (id, config) => cmdClient.post('/command/clients/pre_register', { id, config });
export const listPreRegisteredClients = () => cmdClient.get('/command/clients/pre_registered/list');
export const deletePreRegisteredClient = (uid) => cmdClient.delete('/command/clients/pre_registered/delete', { params: { uid } });
export const updatePreRegisteredClient = (uid, config) => cmdClient.put('/command/clients/pre_registered/update', { uid, config });
export const batchClientAction = (action, client_uids, payload) => cmdClient.post('/command/clients/batch_action', { action, client_uids, payload });
export const restartClient = (clientUid) => cmdClient.post(`/command/client/${clientUid}/restart`);
export const sendNotification = (clientUid, params) => cmdClient.post(`/command/client/${clientUid}/send_notification`, null, { params });
export const triggerClientUpdate = (clientUid) => cmdClient.post(`/command/client/${clientUid}/update_data`);
export const getServerVersion = () => cmdClient.get('/command/server/version');
export const downloadPresetUrl = `${CMD_BASE_URL}/command/server/ManagementPreset.json`;
export const exportDataUrl = `${CMD_BASE_URL}/command/server/export`;
