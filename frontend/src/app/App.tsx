import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PWARegister } from './components/PWARegister';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <>
      <PWARegister />
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
