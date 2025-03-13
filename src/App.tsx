import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import { MessageHandler } from './components/MessageHandler';
import { handleError } from './utils/errorHandler';

// Lazy load components
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ChurchOnboarding = React.lazy(() => import('./pages/onboarding/ChurchOnboarding'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Members = React.lazy(() => import('./pages/members/Members'));
const Finances = React.lazy(() => import('./pages/finances/Finances'));
const Admin = React.lazy(() => import('./pages/admin/Admin'));
const Layout = React.lazy(() => import('./components/Layout'));

// Configure React Query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      onError: (error) => handleError(error),
    },
    mutations: {
      onError: (error) => handleError(error),
    },
  },
});

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    handleError(error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { setUser, user, loading } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
        <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            }
          >
            <MessageHandler />
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/register"
                element={!user ? <Register /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/onboarding"
                element={user ? <ChurchOnboarding /> : <Navigate to="/register" replace />}
              />

              {/* Protected routes */}
              {user ? (
                <Route element={<Layout />}>
                  <Route path="/dashboard/*" element={<Dashboard />} />
                  <Route path="/members/*" element={<Members />} />
                  <Route path="/finances/*" element={<Finances />} />
                  <Route path="/settings/*" element={<Settings />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
              ) : (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </Routes>
            </React.Suspense>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;