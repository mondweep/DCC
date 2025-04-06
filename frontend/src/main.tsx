import React from 'react'; // Import React
import ReactDOM from 'react-dom/client'; // Import ReactDOM
import App from './App.tsx';
import './index.css';
import { Web3Provider } from './contexts/Web3Context.tsx'; // Import the provider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3Provider> {/* Wrap App with the provider */}
      <App />
    </Web3Provider>
  </React.StrictMode>
);
