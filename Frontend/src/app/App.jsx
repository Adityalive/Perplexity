import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import router from './app.routes.jsx';
import { getme } from '../features/auth/services/auth.api.service';
import { setError, setLoading, setUser } from '../features/auth/auth.slice';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      dispatch(setLoading(true));

      try {
        const response = await getme();
        if (!isMounted) {
          return;
        }

        dispatch(setUser(response?.user ?? null));
        dispatch(setError(null));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        dispatch(setUser(null));
        dispatch(
          setError(
            error?.response?.data?.message ||
              error?.message ||
              'Unable to restore session.'
          )
        );
      } finally {
        if (isMounted) {
          dispatch(setLoading(false));
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return (
    <div>
     <RouterProvider router={router} />
    </div>
  )
}

export default App
