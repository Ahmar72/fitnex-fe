import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { WorkoutProvider } from './context/WorkoutContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import './index.css';
import './app.css';
import './layout.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <ToastProvider>
            <AuthProvider>
              <LanguageProvider>
                <WorkoutProvider>
                  <App />
                </WorkoutProvider>
              </LanguageProvider>
            </AuthProvider>
          </ToastProvider>
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
