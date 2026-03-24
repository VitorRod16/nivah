import {RouterProvider} from 'react-router';
import {router} from './routes';
import {PWARegister} from './components/PWARegister';
import {Toaster} from './components/ui/sonner';
import {ThemeProvider} from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <PWARegister />
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
