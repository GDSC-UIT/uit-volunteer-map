import { lazy } from 'react';
import RouteErrorPage from '@/pages/RouteErrorPage';
import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "@/components/layouts/RootLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import AdminLayout from "@/components/layouts/AdminLayout";
import { RoleEnum } from "@uit-volunteer-map/shared";
import LeaderLayout from "@/components/layouts/LeaderLayout";
import CampaignLayout from "@/components/layouts/CampaignLayout";

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const CampaignPage = lazy(() => import('@/pages/CampaignPage'));
const PostPage = lazy(() => import('@/pages/PostPage'));
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const MyTeamPage = lazy(() => import('@/pages/leader/MyTeamPage'));
const LeaderPostPage = lazy(() => import('@/pages/leader/LeaderPostPage'));
const PostEditorPage = lazy(() => import('@/pages/leader/PostEditorPage'));
const CampaignManagementPage = lazy(() => import('@/pages/admin/CampaignManagementPage'));
const TeamManagementPage = lazy(() => import('@/pages/admin/TeamManagementPage'));
const AccountManagementPage = lazy(() => import('@/pages/admin/AccountManagementPage'));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      {
        path: "campaign/:campaignId",
        element: <CampaignLayout />,
        children: [
          { index: true, element: <CampaignPage /> },
          { path: "post/:postId", element: <PostPage /> },
          { path: "team/:teamId/post/:postId", element: <PostPage /> },
          {
            path: "team/:teamId",
            element: <TeamPage />,
          },
        ],
      },
      {
        path: "admin",
        element: <ProtectedRoute requiredRoles={[RoleEnum.ADMIN]} />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            element: <AdminLayout />,
            children: [
              { path: "dashboard", element: <AdminDashboard /> },
              { path: "campaigns", element: <CampaignManagementPage /> },
              { path: "teams", element: <TeamManagementPage /> },
              { path: "accounts", element: <AccountManagementPage /> },
            ],
          },
        ],
      },
      {
        path: "leader",
        element: <ProtectedRoute requiredRoles={[RoleEnum.LEADER]} />,
        children: [
          {
            element: <LeaderLayout />,
            children: [
              { index: true, element: <MyTeamPage /> },
              { path: "posts/new", element: <PostEditorPage /> },
              { path: "posts/:postId", element: <LeaderPostPage /> },
              { path: "posts/:postId/edit", element: <PostEditorPage editing /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
