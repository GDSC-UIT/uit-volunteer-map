import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@uit-volunteer-map/shared';

interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
}

export default function ProtectedRoute({ requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-gray-600" role="status">Đang tải...</h1>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h1 className="text-gray-600">Bạn không có quyền truy cập trang này.</h1>
      </main>
    );
  }

  return <Outlet />;
}
