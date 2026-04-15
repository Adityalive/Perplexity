import { createBrowserRouter } from 'react-router-dom';
import RegisterPage from '../features/auth/pages/RegisterPage';
import LoginPage from '../features/auth/pages/LoginPage';
import Protected from '../features/auth/components/Protected';
import Dashboard from '../features/chat/Pages/Dashboard';
import MusicPage from '../features/music/Pages/MusicPage';
import ResearchPage from '../features/research/Pages/ResearchPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Protected><Dashboard /></Protected>,
  },
  {
    path: '/search/:slug/:chatId',
    element: <Protected><Dashboard /></Protected>,
  },
  {
    path: '/music',
    element: <Protected><MusicPage /></Protected>,
  },
  {
    path: '/research',
    element: <Protected><ResearchPage /></Protected>,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/register/*',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login/*',
    element: <LoginPage />,
  },
]);

export default router;
