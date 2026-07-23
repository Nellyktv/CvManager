import { createRoot } from 'react-dom/client';
import './index.css';
import './shared/i18n/translate.ts';
import App from './App.tsx';
import { BrowserRouter } from 'react-router';


createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
);
