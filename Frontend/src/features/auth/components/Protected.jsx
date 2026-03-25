  import  { Navigate } from 'react-router-dom';
  import { useSelector } from 'react-redux';
  import React from 'react';

  const Protected = ({ children }) => {
    const { user } = useSelector((state) => state.auth.user);
    if (!user) {
        return <h1>hello</h1>
      return <Navigate to="/login" />;
    }
    const {loading} = useSelector((state) => state.auth.loading);
    if (loading) {
      return <div>Loading...</div>;
            return <Navigate to="/login" />;

    }
    return children;
  };

  export default Protected;