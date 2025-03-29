// src/plugins/vuetify.js
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const lightTheme = { dark: false, colors: { primary: '#1976D2', secondary: '#424242', accent: '#82B1FF', error: '#FF5252', info: '#2196F3', success: '#4CAF50', warning: '#FB8C00' } };
const darkTheme = { dark: true, colors: { primary: '#2196F3', secondary: '#B0BEC5' } };

export default createVuetify({ components, directives, theme: { defaultTheme: 'light', themes: { light: lightTheme, dark: darkTheme } } });
