import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import AuthProvider from '@/contexts/AuthProvider';
import { router } from '@/routes';
import "leaflet/dist/leaflet.css";
import './index.css';
import "./styles/leaflet-labels.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
