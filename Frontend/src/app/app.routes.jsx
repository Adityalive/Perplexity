import { createBrowserRouter } from 'react-router-dom';
import RegisterPage from '../features/auth/pages/RegisterPage';
import LoginPage from '../features/auth/pages/LoginPage';
import Protected from '../features/auth/components/Protected';
import Dashboard from '../features/chat/Pages/Dashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Protected><Dashboard /></Protected>,
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
