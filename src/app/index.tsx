import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './styles/design-system.css';
import './index.css';
import { Provider } from 'react-redux';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import store from './lib/store';
import { theme } from './lib/theme';
import reportWebVitals from './reportWebVitals';
import Protected from './protected';
import AppShell from './components/AppShell';
import FeedPage from './components/Feed';
import LegislationTablePage from './components/LegislationTable';
import LegislationDetail from './components/LegislationList/LegislationDetail';
import StoryDetail from './components/StoryList/StoryDetail';
import Notification from './components/Notification';
import AlertasPage from './components/Alertas';
import ResumenesPage from './components/Resumenes';
import GuardadosPage from './components/Guardados';

library.add(fas, far);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <Provider store={store}>
        <Router>
          <Routes>
            <Route path="/" element={<Protected><AppShell /></Protected>}>
              <Route index element={<FeedPage />} />
              <Route path="legislacion" element={<LegislationTablePage />} />
              <Route path="legislacion/:hash" element={<LegislationDetail />} />
              <Route path="noticia/:hash" element={<StoryDetail />} />
              <Route path="alertas" element={<AlertasPage />} />
              <Route path="alertas/actividad" element={<AlertasPage />} />
              <Route path="resumenes" element={<ResumenesPage />} />
              <Route path="guardados" element={<GuardadosPage />} />
              <Route path="notificacion" element={<Notification />} />
              <Route path="mis-proyectos" element={<Navigate to="/guardados" replace />} />
            </Route>
            <Route path="*" element={"Not Found"} />
          </Routes>
        </Router>
      </Provider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
