import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { Setup } from '@types';
import Header from '@components/header';
import SetupService from '@services/SetupService';

type Props = {
  setup: Setup | null;
};

const SetupModifierPage: React.FC<Props> = ({ setup }) => {
  const router = useRouter();
  const { setup_id } = router.query;

  // Convert the hardware components and image IDs to comma-separated strings for the input fields
  const [hardwareComponentIds, setHardwareComponentIds] = useState<string>(
    setup?.hardware_components.map((component) => component.id).join(',') || ''
  );
  const [imageIds, setImageIds] = useState<string>(
    setup?.image_urls.map((image) => image.id).join(',') || ''
  );
  const [details, setDetails] = useState<string>(setup?.details || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      if (!setup) throw new Error('No setup to update');

      // Convert the comma-separated strings back to arrays of numbers
      const hardwareComponentIdsArray = hardwareComponentIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      const imageIdsArray = imageIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      const updatedSetup = {
        details,
        hardwareComponentIds: hardwareComponentIdsArray,
        imageIds: imageIdsArray,
      };

      // Use the updateSetup function from SetupService
      await SetupService.updateSetup(setup_id as string, updatedSetup);

      alert('Setup updated successfully!');
      router.push('/overview');
    } catch (error) {
      console.error('Error updating setup:', error);
      setError('Failed to save changes. Please try again.');
    }
  };

  if (!setup) {
    return (
      <div className="text-center text-red-600 text-lg mt-4">
        Setup with ID {setup_id} not found!
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Modify Setup ID: {setup_id}</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Hardware Component IDs</h3>
          <input
            type="text"
            value={hardwareComponentIds}
            onChange={(e) => setHardwareComponentIds(e.target.value)}
            placeholder="Enter hardware component IDs (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
          />
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Image IDs</h3>
          <input
            type="text"
            value={imageIds}
            onChange={(e) => setImageIds(e.target.value)}
            placeholder="Enter image IDs (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300"
          />
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Setup Details</h3>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Setup Details"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-300 h-28"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { setup_id } = context.params!;

  try {
    const setup = await SetupService.getSetupById(setup_id as string);
    return {
      props: {
        setup,
      },
    };
  } catch (error) {
    console.error('Error fetching setup:', error);
    return {
      props: {
        setup: null,
      },
    };
  }
};

export default SetupModifierPage;




