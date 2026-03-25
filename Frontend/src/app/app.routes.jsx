import { createBrowserRouter } from 'react-router-dom';
import RegisterPage from '../features/auth/pages/RegisterPage';
import LoginPage from '../features/auth/pages/LoginPage';
import Protected from '../features/auth/components/Protected';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Protected><h1>Home</h1></Protected>,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

export default router;
