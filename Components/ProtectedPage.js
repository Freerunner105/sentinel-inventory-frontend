// components/ProtectedPage.js
import React from 'react';
import { useRouter } from 'next/router';

const ProtectedPage = ({ children, allowedRoles, user }) => {
  const router = useRouter();

  if (!user || !allowedRoles.includes(user.role)) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
};

export default ProtectedPage;