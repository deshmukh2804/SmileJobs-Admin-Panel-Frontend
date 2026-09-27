// FILE: frontend/src/views/LoginView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AdminRole, AdminUser } from '../types';
import { RAW_API_BASE_URL as API_BASE_URL } from '../services/api';
import SmileJobsLogo from '../assets/smilejobs.png';

interface LoginViewProps {
  onLoginSuccess: (user: AdminUser, selectedRole?: AdminRole) => void;
}

type AuthFlowState = 'login' | 'two-factor' | 'locked-out' | 'role-picker';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [flowState, setFlowState] = useState<AuthFlowState>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [otpMethod, setOtpMethod] = useState<'app' | 'sms'>('app');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(15 * 60);

  const mapRole = (backendRole: string): AdminRole => {
    const validRoles: AdminRole[] = [
      'Super Admin',
      'Admin',
      'Moderator',
      'Support Agent',
      'Content Manager',
      'Finance Manager',
    ];
    if (validRoles.includes(backendRole as AdminRole)) return backendRole as AdminRole;
    const normalized = backendRole.toLowerCase().replace(/[_-]/g, ' ').trim();
    if (normalized === 'super admin' || normalized === 'superadmin') return 'Super Admin';
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'moderator') return 'Moderator';
    if (normalized === 'support agent' || normalized === 'support') return 'Support Agent';
    if (normalized === 'content manager' || normalized === 'content') return 'Content Manager';
    if (normalized === 'finance manager' || normalized === 'finance') return 'Finance Manager';
    return 'Admin';
  };

  useEffect(() => {
    let timer: any;
    if (flowState === 'two-factor' && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [flowState, resendTimer]);

  useEffect(() => {
    let timer: any;
    if (flowState === 'locked-out' && lockoutSeconds > 0) {
      timer = setInterval(() => setLockoutSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [flowState, lockoutSeconds]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both your corporate email and password.');
      return;
    }

    if (failedAttempts >= 3) {
      setFlowState('locked-out');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 3) {
          setFlowState('locked-out');
        } else {
          setErrorMessage(data.message || 'Invalid administrative credentials.');
        }
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminInfo', JSON.stringify(data.admin));

      setFailedAttempts(0);

      const mappedRole = mapRole(data.admin.role);

      const authenticatedUser: AdminUser = {
        id: data.admin.id,
        name: data.admin.name,
        email: data.admin.email,
        avatarUrl:
          data.admin.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        roles: [mappedRole],
        activeRole: mappedRole,
        department: data.admin.department || 'Platform Operations',
        twoFactorEnabled: false,
      };

      onLoginSuccess(authenticatedUser, mappedRole);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage(
        `Could not connect to the Backend Authentication Service. Please ensure your server is running.`
      );
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      if (!pendingUser) return;

      if (pendingUser.roles.length > 1) {
        setFlowState('role-picker');
      } else {
        onLoginSuccess(pendingUser);
      }
    }, 600);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#fafaf5] text-[#1a1c19] flex flex-col select-none relative overflow-x-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#5F8A72]/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-variant rounded-2xl shadow-xl p-6 sm:p-8 relative">
          
          {/* ============================= */}
          {/* Brand Header (Logo + Title) */}
          {/* ============================= */}
          <div className="flex flex-col items-center text-center mb-8">
            {/* Circular Logo */}
            <div
              onClick={() => setFlowState('login')}
              className="w-20 h-20 rounded-full bg-white border-4 border-primary-container/40 shadow-lg flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform mb-4"
            >
              <img
                src={SmileJobsLogo}
                alt="SmileJobs Brand Logo"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Brand Name & Tagline */}
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold tracking-tight text-primary leading-tight">
                SmileJobs
              </h1>
              <p className="text-[12px] text-outline mt-0.5 font-medium tracking-wide">
                Enterprise Portal
              </p>
            </div>
            
            {/* Certification Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-outline text-[11px] font-semibold border border-outline-variant mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5F8A72] animate-pulse" />
              SOC2 Type II &amp; ISO-27001 Certified
            </div>
          </div>

          {/* ============================= */}
          {/* LOGIN VIEW */}
          {/* ============================= */}
          {flowState === 'login' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-lg font-bold text-primary">Administrator Sign In</h2>
                <p className="text-xs text-on-surface-variant mt-1.5">
                  Enter your credentials to access your secure workspace.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-error-container/30 border border-error-container text-on-error-container text-xs flex items-start gap-2.5 animate-fade-in">
                  <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
                    error
                  </span>
                  <div>
                    <p className="font-semibold text-error">Authentication Failed</p>
                    <p className="mt-0.5 text-on-surface-variant">{errorMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      autoComplete="off"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-outline/60"
                    />
                    <span className="material-symbols-outlined text-[18px] text-outline absolute left-2.5 top-3">
                      mail
                    </span>
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="new-password"
                      disabled={isLoading}
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-outline/60"
                    />
                    <span className="material-symbols-outlined text-[18px] text-outline absolute left-2.5 top-3">
                      lock
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface p-0.5 rounded cursor-pointer"
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span>Remember this device for 30 days</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary-container text-on-secondary font-semibold hover:bg-primary transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Security Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Console</span>
                      <span className="material-symbols-outlined text-[18px]">login</span>
                    </>
                  )}
                </button>
              </form>

              {failedAttempts > 0 && (
                <p className="text-center text-[11px] text-error font-medium">
                  {3 - failedAttempts} attempt(s) remaining before security lockout.
                </p>
              )}
            </div>
          )}

          {/* ============================= */}
          {/* TWO-FACTOR VIEW */}
          {/* ============================= */}
          {flowState === 'two-factor' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[26px]">phonelink_lock</span>
                </div>
                <h2 className="text-xl font-bold text-primary">Two-Factor Authentication</h2>
                <p className="text-xs text-on-surface-variant mt-1.5">
                  High-privilege account. Enter code from your{' '}
                  <strong className="text-primary">
                    {otpMethod === 'app' ? 'Authenticator App' : 'SMS'}
                  </strong>.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-error-container/30 border border-error-container text-on-error-container text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-error">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex rounded-lg bg-surface-container p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setOtpMethod('app')}
                  className={`flex-1 py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    otpMethod === 'app'
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">smartphone</span>
                  <span>Authenticator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMethod('sms')}
                  className={`flex-1 py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    otpMethod === 'sms'
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">sms</span>
                  <span>SMS (•••-8821)</span>
                </button>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-mono font-bold rounded-lg border border-outline-variant bg-surface-container-lowest text-primary focus:outline-none focus:border-primary shadow-xs"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-outline pt-1">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span>Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(30)}
                      className="text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary-container text-on-secondary font-semibold hover:bg-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validating 2FA Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify &amp; Continue</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFlowState('login')}
                  className="w-full text-center text-xs text-outline hover:text-primary py-1 cursor-pointer"
                >
                  ← Back to login
                </button>
              </form>
            </div>
          )}

          {/* ============================= */}
          {/* ROLE PICKER VIEW */}
          {/* ============================= */}
          {flowState === 'role-picker' && pendingUser && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary-fixed text-primary flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[26px]">switch_account</span>
                </div>
                <h2 className="text-xl font-bold text-primary">Continue as…</h2>
                <p className="text-xs text-on-surface-variant mt-1.5">
                  Your account holds multiple administrative roles. Select which view to launch:
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {pendingUser.roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onLoginSuccess(pendingUser, role)}
                    className="w-full p-3.5 rounded-xl border border-surface-variant hover:border-primary bg-surface-container-low/40 text-left flex items-center justify-between cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-surface-variant text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">
                          {role === 'Super Admin' ? 'security' : 'person'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-primary text-sm block">{role}</span>
                        <span className="text-[11px] text-outline block">
                          Launch administrative workspace
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================= */}
          {/* LOCKED OUT VIEW */}
          {/* ============================= */}
          {flowState === 'locked-out' && (
            <div className="space-y-4 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto border border-error/30">
                <span className="material-symbols-outlined text-[32px] text-error">lock_clock</span>
              </div>
              <h2 className="text-xl font-bold text-primary">Account Temporarily Locked</h2>
              <p className="text-xs text-on-surface-variant">
                Too many incorrect login attempts. Access is temporarily blocked.
              </p>

              <div className="p-4 rounded-xl bg-error-container/20 border border-error-container/60 text-center">
                <span className="text-[11px] text-error font-semibold">Unlock In</span>
                <div className="text-3xl font-mono font-bold text-error tracking-widest my-1">
                  {formatLockoutTime(lockoutSeconds)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFailedAttempts(0);
                  setErrorMessage(null);
                  setLockoutSeconds(15 * 60);
                  setFlowState('login');
                }}
                className="w-full py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container text-xs font-semibold cursor-pointer shadow-xs"
              >
                Reset Security Lockout
              </button>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-4 border-t border-surface-variant flex items-center justify-between text-[10px] text-outline">
            <span>SmileJobs Admin Engine v3.4</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[12px] text-[#5F8A72]">
                verified_user
              </span>
              <span>TLS 1.3 Secure Connection</span>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="w-full py-3 px-4 text-center text-xs text-outline border-t border-surface-variant bg-surface-container-low/40">
        © 2026 SmileJobs Inc. Enterprise Administrative Subsystem. All actions are logged and audited.
      </footer>
    </div>
  );
};