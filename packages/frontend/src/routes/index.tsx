import { createBrowserRouter, Navigate } from "react-router";
import RootLayout from "@/components/layouts/RootLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import AdminLayout from "@/components/layouts/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFoundPage from "@/pages/NotFoundPage";
import { RoleEnum } from "@uit-volunteer-map/shared";
import LeaderLayout from "@/components/layouts/LeaderLayout";
import CampaignPage from "@/pages/CampaignPage";
import TeamPage from "@/pages/TeamPage";
import MyTeamPage from "@/pages/leader/MyTeamPage";
import CampaignManagementPage from "@/pages/admin/CampaignManagementPage";
import TeamManagementPage from "@/pages/admin/TeamManagementPage";
import AccountManagementPage from "@/pages/admin/AccountManagementPage";
import CampaignLayout from "@/components/layouts/CampaignLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      {
        path: "campaign/:campaignId",
        element: <CampaignLayout />,
        children: [
          { index: true, element: <CampaignPage /> },
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
            children: [{ index: true, element: <MyTeamPage /> }],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
