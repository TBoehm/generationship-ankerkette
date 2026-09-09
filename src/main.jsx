import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { APP_CONFIG } from './infrastructure/config/appConfig.js';
import './infrastructure/i18n/index.js';
import './presentation/styles/tokens.css';
import './presentation/styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      basename={APP_CONFIG.basePath}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>
);
