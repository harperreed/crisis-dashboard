// ABOUTME: Application entry point that mounts Svelte app to DOM
// ABOUTME: Imports global styles and initializes root App component
import './app.css';
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')
});

export default app;
