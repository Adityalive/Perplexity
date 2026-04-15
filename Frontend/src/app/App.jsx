import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import router from './app.routes.jsx';
import { getme } from '../features/auth/services/auth.api.service';
import { setError, setLoading, setUser } from '../features/auth/auth.slice';

const App = () => {
  return (
    <div>
     <RouterProvider router={router} />
    </div>
  )
}

export default App
