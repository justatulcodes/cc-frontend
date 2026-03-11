import { useState } from "react";
import { login } from "../api";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="var(--hex-login-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="var(--hex-login-placeholder)" strokeWidth="2" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="var(--hex-login-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="var(--hex-login-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" stroke="var(--hex-login-placeholder)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="var(--hex-login-placeholder)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  return (
    <div
      className="w-full min-h-screen flex flex-col lg:flex-row overflow-y-auto"
      style={{ fontFamily: "'Open Sans', sans-serif", backgroundColor: 'var(--primary-bg)' }}
    >
      {/* Left Branding Section */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden lg:min-h-screen"
        style={{ 
          backgroundColor: "rgba(10, 2, 49, 0.69)",
          backgroundImage: "url('/loginmage.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Blurred Overlay Layer - between text and image */}
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            backgroundImage: "url('/loginmage.svg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            opacity: 0.5
          }}
        />
        {/* Decorative Blurs */}
        <div className="absolute left-0 top-0 w-full h-full opacity-10 pointer-events-none">
          <div
            className="absolute left-[10%] top-[10%] w-80 h-80 rounded-full"
            style={{ background: 'var(--login-blur-primary)', filter: 'blur(82px)' }}
          />
          <div
            className="absolute left-[25%] top-[50%] w-96 h-96 rounded-full"
            style={{ background: 'var(--login-blur-secondary)', filter: 'blur(82px)' }}
          />
        </div>

        {/* Content Container - transparent to show background image */}
        <div 
          className="relative flex flex-col gap-24 p-12 xl:p-12 max-w-3xl w-full h-full z-10"
          style={{
            backgroundColor: 'transparent',
            width: '800px',
            height: '220px',
            position: 'relative',
            top: '50px',
            left: '3px'
          }}
        >
          <div className="flex flex-col gap-8 max-w-2xl">
            <div className="flex flex-col">
              
              <h3 
                className="mb-8"
                style={{ 
                  color: 'var(--color-surface-0)',
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: '60px',
                  letterSpacing: '0.52px',
                  display: 'flex',
                  flexDirection: 'column',
                  lineHeight: '1.1'
                }}
              >
                <span>Access Your <span style={{ fontWeight: 700, color: 'var(--color-surface-0)' }}>Analytics.</span></span>
                <span><span style={{ fontWeight: 700, color: 'var(--color-surface-0)' }}>Unlock</span> <span style={{ fontWeight: 700, color: 'var(--color-surface-0)' }}>Smarter</span> <span style={{ fontWeight: 700, color: 'var(--color-surface-0)' }}>Decisions.</span></span>
              </h3>
              <p className="text-base leading-relaxed" style={{ color: 'var(--color-mint-100)' }}>Log in to your centralized dashboard to monitor performance, track 
                
              </p>
              <p className="text-base leading-relaxed" style={{ color: 'var(--color-mint-100)' }}>
                key metrics, and gain real-time insights across your business operations.
              </p>
              <p className="text-base leading-relaxed" style={{ color: 'var(--color-mint-100)' }}>
                operations.
              </p>
            </div>

            <div className="flex flex-col gap-10">
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'var(--login-feature-icon-bg)' }}>
                  <img alt="Premium Quality Products" className="w-6 h-6" src="/realtimeimage.svg" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold leading-relaxed" style={{ color: 'var(--hex-white)' }}>
                   Real Time Performance Monitoring
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-mint-100)' }}>
                    Track live data, performance trends, and key metrics in one unified view.
                  </p>
                </div>
              </div>             
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'var(--login-feature-icon-bg)' }}>
                  <img alt="Expert Garden Solutions" className="w-6 h-6" src="/customdashboard.svg" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold leading-relaxed" style={{ color: 'var(--hex-white)' }}>
                    Custom Dashboards
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-mint-100)' }}>
                    Access personalized dashboards tailored to your business goals and KPIs.
                  </p>
                </div>
              </div>              
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0" style={{ background: 'var(--login-feature-icon-bg)' }}>
                  <img alt="Sustainable & Eco-Friendly" className="w-6 h-6" src="/actioninsights.svg" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold leading-relaxed" style={{ color: 'var(--hex-white)' }}>
                    Actionable Insights & Reporting
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-mint-100)' }}>
                    Transform raw data into clear, actionable insights with visual reports and analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      

      {/* Right Login Form Section */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-8 lg:p-12" style={{ backgroundColor: 'var(--primary-bg)' }}>
        <div className="w-full max-w-md pb-12">
          <div className="flex flex-col gap-2 mb-8">
            <p 
              className="text-4xl font-bold" 
              style={{ color: 'var(--login-heading)', textAlign: 'center' }}
            >
              Login to your account
            </p>
            
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">            
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--login-heading)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter your email address"
                required
                className="w-full h-12 px-4 py-2 border rounded-lg text-sm transition focus:outline-none"
                style={{
                  background: 'var(--color-surface-0)',
                  color: 'var(--login-heading)',
                  borderColor: 'var(--primary-border)'
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--login-heading)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full h-12 px-4 py-2 pr-12 border rounded-lg text-sm transition focus:outline-none"
                  style={{
                    background: 'var(--color-surface-0)',
                    color: 'var(--login-heading)',
                    borderColor: 'var(--primary-border)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center hover:opacity-60 transition focus:outline-none"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm border" style={{ backgroundColor: 'var(--login-error-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
        <button
  type="submit"
  disabled={loading}
  className="w-full h-12 text-white text-base font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  style={{ 
    backgroundColor: 'var(--color-primary-500)',
    borderRadius: '24px' 
  }}
>
  {loading ? (
    "Logging in..."
  ) : (
    <>
      Login
      <svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </>
  )}
</button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-base" style={{ color: 'var(--login-footer-text)' }}>
              Need help?{' '}
              <a
                className="font-semibold cursor-pointer hover:underline"
                style={{ color: 'var(--color-text-900)' }}
                href="mailto:sharma@byte-digital.com.au"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}