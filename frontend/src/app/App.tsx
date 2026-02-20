import { RouterProvider } from 'react-router';
import { router } from './routes.js';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import '../styles/theme.css';
import '../styles/fonts.css';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" closeButton richColors />
    </AuthProvider>
  );
}

export default App;
