import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { RoleEnum } from '@uit-volunteer-map/shared';
import FloatingInput from '@/components/ui/FloatingInput';
import EyeIcon from '@/assets/icons/eye.svg';


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in, with admin/leader specific redirects
  useEffect(() => {
    if (isAuthenticated && user) {
      // If redirected from a protected page, go back there
      const redirectTo = location.state?.from?.pathname;

      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        // Otherwise, redirect based on role
        switch (user.role) {
          case RoleEnum.ADMIN:
            navigate('/admin/dashboard', { replace: true });
            break;
          case RoleEnum.LEADER:
            navigate('/leader', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(username, password);
      // Redirect handled by useEffect after auth state changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

return (
    <div className="min-h-screen bg-linear-to-b from-[#0480BA] to-[#023A54] flex items-center justify-center">
      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-180 h-139.75 bg-white rounded-[40px] shadow-md"
      >
        {/* Header Logo */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-start gap-1">
          <div className="w-6 h-6 bg-[#4D5358]" />
          <div className="flex flex-col items-end">
            <div className="text-[48px] font-bold leading-[52.8px] text-[#697077]">
              UITVolunteer
            </div>
            <div className="text-[24px] font-normal leading-[33.6px] text-[#697077]">
              xxxxxxxxxxx
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="absolute top-48.25 left-1/2 -translate-x-1/2 w-140 text-center text-[42px] font-bold leading-11.5 text-[#21272A]">
          Đăng nhập
        </div>

        {/* Error */}
        {error && (
          <div className="absolute top-60 left-1/2 -translate-x-1/2 w-140 text-center text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Username */}
        <div className="absolute top-67.25 left-1/2 -translate-x-1/2 w-140">
          <FloatingInput
            label="Tên đăng nhập"
            value={username}
            onChange={setUsername}
            disabled={isSubmitting}
          />
        </div>

        {/* Password */}
        <div className="absolute top-87.25 left-1/2 -translate-x-1/2 w-140">
          <FloatingInput
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            disabled={isSubmitting}
          />

          {/* Eye button */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6"
          >
            <div className="relative w-6 h-6">
              {/* Eye icon */}
              <img src={EyeIcon} alt="eye" className="w-6 h-6" />

              {/* Slash when hidden */}
              {!showPassword && (
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-[#21272A] -rotate-45" />
              )}
            </div>
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="absolute top-107.25 left-1/2 -translate-x-1/2 w-140 h-12.5
            rounded-lg bg-[#023A54]
            text-white font-bold text-[20px]
            hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
        </button>

        {/* Divider */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-140 border-t border-[#DDE1E6]" />
      </form>
    </div>
  );
}