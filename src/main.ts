import './style.css';
import { MyopiaApp } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const app = new MyopiaApp();
  
  // Expose for debugging if needed
  (window as any).myopiaApp = app;
});
