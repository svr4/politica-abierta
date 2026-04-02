import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import { HashRouter as Router, Route, Routes } from 'react-router';
import store from './lib/store';
import reportWebVitals from './reportWebVitals';
import LegislationList from './components/LegislationList';
import StoryDetail from './components/StoryList/StoryDetail';
import LegislationDetail from './components/LegislationList/LegislationDetail';
import Protected from './protected';
import Notification from './components/Notification';
import MyProjects from './components/MyProjects';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path='/' element={<Protected><App /></Protected>} />
          <Route path='/noticia/:hash' element={<Protected><StoryDetail /></Protected>} />
          <Route path='/legislacion/:hash' element={<Protected><LegislationDetail /></Protected>} />
          <Route path='/notificacion' element={<Protected><Notification /></Protected>} />
          <Route path='/mis-proyectos' element={<Protected><MyProjects /></Protected>} />
          <Route path='*' element={"Not Found"} />
        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
