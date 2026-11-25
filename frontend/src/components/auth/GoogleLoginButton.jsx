import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../config/firebase';
import { firebaseLogin, googleLogin } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

/**
 * Google Sign-In Button:
 * - Uses Firebase Authentication (GoogleAuthProvider popup) when VITE_FIREBASE_* is configured.
 * - Falls back to Google Identity Services (GIS) when VITE_GOOGLE_CLIENT_ID is configured.
 * - Otherwise displays a styled button with setup instructions on click.
 */
export default function GoogleLoginButton({ role = 'guest', onSuccess, text = 'continue_with' }) {
  const dispatch = useDispatch();
  const buttonContainerRef = useRef(null);
  const [gisReady, setGisReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (isFirebaseConfigured || !clientId) return;

    let cancelled = false;
    const initGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonContainerRef.current) return false;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) {
            toast.error('Google sign-in did not return a credential.');
            return;
          }
          const result = await dispatch(
            googleLogin({ credential: response.credential, role })
          );
          if (!result.error) {
            toast.success('Signed in with Google!');
            if (onSuccess) onSuccess(result.payload);
          } else {
            toast.error(result.payload || 'Google sign-in failed');
          }
        },
      });

      buttonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width: buttonContainerRef.current.offsetWidth || 360,
      });
      setGisReady(true);
      return true;
    };

    if (!initGoogle()) {
      const interval = setInterval(() => {
        if (initGoogle()) clearInterval(interval);
      }, 250);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [clientId, role, text, dispatch, onSuccess]);

  const handleFirebaseGoogleSignIn = async () => {
    if (!auth || !googleProvider) return;
    try {
      setSigningIn(true);
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      const result = await dispatch(firebaseLogin({ idToken, role }));
      if (!result.error) {
        toast.success('Signed in with Google via Firebase!');
        if (onSuccess) onSuccess(result.payload);
      } else {
        toast.error(result.payload || 'Firebase sign-in failed');
      }
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        toast.error(err?.message || 'Google sign-in failed');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleFallbackClick = () => {
    toast.error(
      'Firebase / Google Auth is not configured yet. Add VITE_FIREBASE_* keys in frontend/.env and FIREBASE_* keys in backend/.env.',
      { duration: 5000 }
    );
  };

  if (!isFirebaseConfigured && clientId) {
    return (
      <div className="w-full">
        <div ref={buttonContainerRef} className="w-full flex justify-center min-h-[42px]" />
        {!gisReady && (
          <div className="text-center text-xs text-gray-400 mt-1">Loading Google Sign-In...</div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={signingIn}
      onClick={isFirebaseConfigured ? handleFirebaseGoogleSignIn : handleFallbackClick}
      className="w-full py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm shadow-sm transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
        />
      </svg>
      <span>{signingIn ? 'Signing in...' : 'Continue with Google'}</span>
    </button>
  );
}
