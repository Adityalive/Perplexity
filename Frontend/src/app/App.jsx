import React from 'react'
import { RouterProvider } from 'react-router-dom';
import router from './app.routes.jsx';
const App = () => {
  return (
    <div>
     <RouterProvider router={router} />
    </div>
  )
}

export default App