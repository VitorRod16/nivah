import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PWARegister } from './components/PWARegister';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <PWARegister />
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
