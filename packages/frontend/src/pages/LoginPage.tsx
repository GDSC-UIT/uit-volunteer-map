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

  // Validate redirect path to prevent open redirect attacks
  const isValidRedirectPath = (path: unknown): path is string => {
    if (typeof path !== 'string') return false;
    // Must start with / and not contain :// or start with //
    return path.startsWith('/') && !path.includes('://') && !path.startsWith('//');
  };

  // Redirect if already logged in, with admin/leader specific redirects
  useEffect(() => {
    if (isAuthenticated && user) {
      // If redirected from a protected page, go back there (with validation)
      const redirectTo = location.state?.from?.pathname;

      if (isValidRedirectPath(redirectTo)) {
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
    <main className="min-h-screen bg-linear-to-b from-[#0480BA] to-[#023A54] flex items-center justify-center px-4 py-8">
      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-180 bg-white rounded-[40px] shadow-md px-6 pt-10 pb-10 sm:px-20 sm:pt-20"
      >
        {/* Header Logo */}
        <div className="flex items-start justify-center gap-1">
          <div className="w-4 h-4 sm:w-6 sm:h-6 shrink-0 bg-[#4D5358]" />
          <div className="flex flex-col items-end">
            <div className="text-[30px] leading-[1.1] sm:text-[48px] font-bold text-[#697077]">
              UITVolunteer
            </div>
            <div className="text-[18px] sm:text-[24px] font-normal leading-[1.4] text-[#697077]">
              xxxxxxxxxxx
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mt-6 text-center font-body text-[32px] sm:text-[42px] font-bold leading-[1.1] text-[#21272A]">
          Đăng nhập
        </h1>

        {/* Error */}
        {error && (
          <div role="alert" className="mt-4 text-center text-red-600 text-sm wrap-break-word">
            {error}
          </div>
        )}

        {/* Username */}
        <div className="mt-8">
          <FloatingInput
            label="Tên đăng nhập"
            value={username}
            onChange={setUsername}
            disabled={isSubmitting}
          />
        </div>

        {/* Password */}
        <div className="relative mt-7.5">
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
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            className="absolute z-20 right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#023A54]"
          >
            <div className="relative w-6 h-6">
              {/* Eye icon */}
              <img src={EyeIcon} alt="" className="w-6 h-6" />

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
          className="mt-7.5 w-full min-h-12.5
            rounded-lg bg-[#023A54]
            text-white font-bold text-[20px]
            hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#023A54]"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
        </button>

        {/* Divider */}
        <div className="mt-10 border-t border-[#DDE1E6]" />
      </form>
    </main>
  );
}
