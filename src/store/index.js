// src/store/index.js
import { createPinia } from 'pinia';
import { useAppStore } from './app';
import { useDataStore } from './data';

const pinia = createPinia();

export { useAppStore, useDataStore };
export default pinia;
