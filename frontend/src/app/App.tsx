import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PWARegister } from './components/PWARegister';

export default function App() {
  return (
    <>
      <PWARegister />
      <RouterProvider router={router} />
    </>
  );
}
