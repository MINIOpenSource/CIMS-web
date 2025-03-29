// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './store';
import vuetify from './plugins/vuetify';
// import { loadFonts } from './plugins/webfontloader';
import './assets/main.css';

// loadFonts();

createApp(App).use(pinia).use(router).use(vuetify).mount('#app');
