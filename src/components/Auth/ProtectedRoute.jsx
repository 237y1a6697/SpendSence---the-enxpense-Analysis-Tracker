import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // If not logged in, redirect to landing page (or login page)
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
