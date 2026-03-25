import {createBrowserRouter} from "react-router-dom";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <h1>Home</h1>,
    },
    {
        path: "/Register",
        element: <h1>Register</h1>,
    },{
        path: "/Login",
        element: <h1>Login</h1>,
    },
])
export default router;