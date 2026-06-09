import { useState } from 'react';
import { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } from '../firebase/auth';
import Loader from '../components/UI/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Login({ loading }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const resetMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleGoogleLogin = async () => {
    resetMessages();
    setIsProcessing(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Login failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please complete the sign-in process.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Unauthorized domain. Add "' + window.location.hostname + '" to Firebase Auth authorized domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked. Allow popups for this site and try again.');
      } else {
        setError('Error: ' + (err.code || err.message || 'Unknown error'));
      }
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsProcessing(true);
      try {
        await resetPassword(email);
        setSuccessMsg('Password reset email sent! Please check your inbox.');
      } catch (err) {
        console.error('Password reset failed:', err);
        setError('Failed to send reset email. Please check the email address.');
      }
      setIsProcessing(false);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setIsProcessing(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      console.error('Auth failed:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Authentication failed. Please try again later.');
      }
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="blob bg-accent-gold w-72 h-72 -top-10 -left-10"></div>
        <div className="blob bg-accent-teal w-96 h-96 top-40 -right-20 animation-delay-2000"></div>
        <div className="blob bg-accent-rose w-80 h-80 -bottom-20 left-20 animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card p-8 sm:p-12 max-w-md w-full text-center relative z-10 shadow-2xl shadow-black/50"
      >
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-tr from-accent-gold/20 to-accent-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-accent-gold/20">
            <span className="text-4xl text-accent-gold" style={{ fontFamily: 'Playfair Display' }}>A</span>
          </div>
          <h1 className="font-display text-4xl text-accent-gold mb-2 tracking-tight">Anzaar</h1>
          <p className="text-text-muted text-sm tracking-wide uppercase">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start text-sm text-left gap-3 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-accent-teal/10 border border-accent-teal/20 text-accent-teal p-3 rounded-lg flex items-start text-sm text-left gap-3 overflow-hidden"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="relative text-left">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-text-muted" />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-all"
              disabled={isProcessing}
            />
          </div>
          
          {mode !== 'forgot' && (
            <div className="relative text-left">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-elevated border border-border rounded-xl pl-10 pr-12 py-3 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-all"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setMode('forgot'); resetMessages(); }}
                className="text-xs text-accent-gold hover:brightness-110 transition-all focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isProcessing}
            className="w-full bg-accent-gold text-bg-primary font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:brightness-110 hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-bg-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <span>
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
              </span>
            )}
          </motion.button>
        </form>

        {mode !== 'forgot' && (
          <div className="text-sm text-text-muted mb-6">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); resetMessages(); }}
                  className="text-accent-gold font-medium hover:brightness-110 transition-all focus:outline-none"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); resetMessages(); }}
                  className="text-accent-gold font-medium hover:brightness-110 transition-all focus:outline-none"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        )}

        {mode === 'forgot' && (
          <div className="text-sm text-text-muted mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); resetMessages(); }}
              className="flex items-center justify-center gap-2 mx-auto text-accent-gold font-medium hover:brightness-110 transition-all focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink-0 mx-4 text-text-muted text-xs uppercase tracking-widest">or continue with</span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              type="button"
              disabled={isProcessing}
              className="w-full bg-white text-gray-900 font-semibold px-6 py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </motion.button>
          </>
        )}
        
        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-text-muted">
            Secured by Firebase Authentication. Only authorized personnel can access the dashboard.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
