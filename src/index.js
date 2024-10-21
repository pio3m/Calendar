import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

const supabaseUrl = 'https://edaolfcwogortdsiqgrh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYW9sZmN3b2dvcnRkc2lxZ3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk0OTUwODgsImV4cCI6MjA0NTA3MTA4OH0.yTMJ4Nq2n-35SuvTAIc5XLTKPeRL_084YnsViZj_JRg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <App />
    </SessionContextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
