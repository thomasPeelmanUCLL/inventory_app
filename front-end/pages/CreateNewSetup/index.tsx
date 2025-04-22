import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Header from '@components/header';
import CreateNewSetupForm from '@components/CreateNewSetupForm';

const CreateNewSetup: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('token');

      // Parse user data if it exists
      const parsedUser = userData ? JSON.parse(userData) : null;
      const userRole = parsedUser?.role;

      setIsGuest(userRole === 'guest');
      setIsAuthenticated(!!token && userRole !== 'guest');
    }
  }, []);

  if (isAuthenticated === null) {
    // Prevent rendering until we know the authentication state
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Create New Setup</title>
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-6">
        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-6 text-center">Create New Setup</h1>
        {/* Conditional Content */}
        {isAuthenticated ? (
          <CreateNewSetupForm />
        ) : (
          <div className="flex justify-center items-center h-full">
            <div className="text-red-600 border border-red-500 bg-red-100 px-4 py-2 rounded mb-4">
              <strong>Error: </strong>
              {isGuest
                ? 'Log in as a non-guest user to create a new setup.'
                : 'Unauthorized, log in with a valid account to create a new setup.'}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default CreateNewSetup;






