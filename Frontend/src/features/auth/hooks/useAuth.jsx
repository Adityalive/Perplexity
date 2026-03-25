import { registerUser,loginUser,getme } from "../services/auth.api.service";
import {useSelector} from "react-redux";
import { useDispatch } from "react-redux";
import { setError,setLoading,setUser } from "../auth.slice";

export function useAuth() {
    const dispatch = useDispatch();

     async function handleregisterUser({ username, email, password }) {
       try{
        dispatch(setLoading(false));
        const response = await registerUser({ username, email, password });
       }catch(error){
        dispatch(setError(error.message));
        console.error('Error registering user:', error);
        throw error;
       }
       finally{
        dispatch(setLoading(false));
       }
      }

    async function handleloginUser({ email, password }) {
        try{
            dispatch(setLoading(false));
            const response = await loginUser({ email, password });
            dispatch(setUser(response.user));
        }catch(error){
            dispatch(setError(error.message));
            console.error('Error logging in user:', error);
            throw error;
        }
        finally{
            dispatch(setLoading(false));
        }
    }

    async function handlegetme() {
        try{
            dispatch(setLoading(false));
            const response = await getme();
            dispatch(setUser(response.user));
        }catch(error){
            dispatch(setError(error.message));
            console.error('Error fetching user data:', error);
            throw error;
        }
        finally{
            dispatch(setLoading(false));
        }
    }


    return {
        handlegetme,
        handleloginUser,
        handleregisterUser
    };
}