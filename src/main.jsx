// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Sayfalarımızı ve component'lerimizi import ediyoruz
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NewCongressPage from './pages/NewCongressPage.jsx';
import CongressDetailPage from './pages/CongressDetailPage.jsx';
import EditCongressPage from './pages/EditCongressPage.jsx'; // <-- BURAYI EKLEDİK
import MySubmissionsPage from './pages/MySubmissionsPage.jsx';
import MyReviewsPage from './pages/MyReviewsPage.jsx';
import ReviewDetailPage from './pages/ReviewDetailPage.jsx';
import NewSessionPage from './pages/NewSessionPage.jsx';
import ProgramSchedulePage from './pages/ProgramSchedulePage.jsx';
import AdminSubmissionDetail from './pages/AdminSubmissionDetail.jsx'; 
import SubmissionDetailPage from './pages/SubmissionDetailPage.jsx';
import './index.css';

const queryClient = new QueryClient();

// Rotaları mantıksal bir sıraya koyuyoruz.
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'dashboard/congresses/:congressId/schedule',
        element: (
          <ProtectedRoute>
            <ProgramSchedulePage />
          </ProtectedRoute>
        )
      },
      {
        index: true, 
        element: <LoginPage />
      },
      {
        path: 'dashboard', 
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'dashboard/my-submissions',
        element: (
            <ProtectedRoute>
                <MySubmissionsPage />
            </ProtectedRoute>
        )
      },
      {
        path: 'dashboard/my-reviews',
        element: (
            <ProtectedRoute>
                <MyReviewsPage />
            </ProtectedRoute>
        )
      },
      {
        path: 'dashboard/congresses/new',
        element: (
          <ProtectedRoute>
            <NewCongressPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'dashboard/congresses/:congressId',
        element: (
          <ProtectedRoute>
            <CongressDetailPage />
          </ProtectedRoute>
        )
      },
      {
        // <-- YENİ EKLENEN ROTA BURADA -->
        path: 'dashboard/congresses/:id/edit',
        element: (
          <ProtectedRoute>
            <EditCongressPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'dashboard/congresses/:congressId/sessions/new',
        element: (
            <ProtectedRoute>
                <NewSessionPage />
            </ProtectedRoute>
        )
      },
      {
        // YAZARIN KENDİ BAŞVURUSUNU GÖRECEĞİ ROTA (Çalışma Masası)
        path: 'dashboard/my-submissions/:submissionId',
        element: (
          <ProtectedRoute>
            <SubmissionDetailPage />
          </ProtectedRoute>
        )
      },
      {
        // YÖNETİCİNİN İNCELEME YAPACAĞI ROTA (Admin Paneli)
        path: 'dashboard/admin/submissions/:submissionId',
        element: (
          <ProtectedRoute>
            <AdminSubmissionDetail />
          </ProtectedRoute>
        )
      },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);