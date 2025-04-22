import React, { useState } from 'react';
import Head from 'next/head';
import Header from '@components/header';
import SetupService from '@services/SetupService';
import EditYourSetupComponent from '@components/EditYourSetupComponent';
import { Setup } from '@types';
import useInterval from '../../hooks/useInterval';

const EditYourSetupPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<Setup[]>([]);

  const fetchSetups = async () => {
    try {
      const userData = sessionStorage.getItem('user');
      if (!userData) {
        throw new Error("No user data found, please log in to see your setups.");
      }

      const parsedUser = JSON.parse(userData);
      const storedUsername = parsedUser.username;
      const storedRole = parsedUser.role;

      if (!storedUsername || !storedRole) {
        throw new Error("Incomplete user data found. Please log in again.");
      }

      // Check if the role is "guest"
      if (storedRole === 'guest') {
        setError("Log in as a non-guest to see and alter your setups.");
        return;
      }

      const result = await SetupService.getAllSetups();
      if (result.error) {
        setError(result.error);
        return;
      }

      // Admin sees all setups; non-admin users see only their own setups
      const filteredSetups =
        storedRole === 'admin'
          ? result
          : result.filter((setup: Setup) => setup.owner.name === storedUsername);

      if (filteredSetups.length === 0) {
        setError(
          storedRole === 'admin'
            ? "No setups found."
            : "No setups found for the current user."
        );
        return;
      }

      setSetup(filteredSetups);
      setError(null); // Clear error if successful
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching setups.");
    } finally {
      setLoading(false);
    }
  };

  // Poll setups every 5 seconds
  useInterval(() => {
    fetchSetups();
  }, 5000);

  // Fetch setups once on component mount
  React.useEffect(() => {
    fetchSetups();
  }, []);

  const selectsetups = (selectedSetup: Setup) => {
    console.log('Selected setup:', selectedSetup);
  };

  return (
    <>
      <Head>
        <title>Edit Your Setup(s)</title>
      </Head>
      <Header />
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Edit Your Setup(s)</h1>
          <section>
            {loading && (
              <p className="text-gray-500 text-center">Loading setups...</p>
            )}
            {error && (
              <div className="text-red-600 border border-red-500 bg-red-100 px-4 py-2 rounded mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}
            {!loading && !error && setup.length === 0 && (
              <p className="text-gray-500 text-center">
                {error || "No setups available."}
              </p>
            )}
            {!loading && !error && setup.length > 0 && (
              <EditYourSetupComponent setups={setup} selectsetups={selectsetups} />
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default EditYourSetupPage;










