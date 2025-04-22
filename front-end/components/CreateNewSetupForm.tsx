import React, { useState, useEffect } from 'react';
import SetupService from '@services/SetupService';
import HardwareService from '@services/HardwareService';
import ImageService from '@services/ImageService';

const CreateNewSetupForm: React.FC = () => {
  const [hardwareIdsInput, setHardwareIdsInput] = useState<string>('');
  const [imageIdsInput, setImageIdsInput] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hardwareComponents, setHardwareComponents] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hardwareData = await HardwareService.getHardwareComponents();
        const imageData = await ImageService.getImages();
        setHardwareComponents(Array.isArray(hardwareData) ? hardwareData : []);
        setImages(Array.isArray(imageData) ? imageData : []);
      } catch (error) {
        console.error('Failed to fetch hardware components or images:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const hardwareComponentIds = hardwareIdsInput
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id !== '')
      .map(Number);

    const imageIds = imageIdsInput
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id !== '')
      .map(Number);

    if (hardwareComponentIds.some(isNaN) || imageIds.some(isNaN)) {
      setErrorMessage('Please enter valid numbers for hardware and image IDs.');
      return;
    }

    if (!details.trim()) {
      setErrorMessage('Details cannot be empty.');
      return;
    }

    const setupData = {
      details,
      hardwareComponentIds,
      imageIds,
    };

    try {
      await SetupService.createSetup(setupData);
      setSuccessMessage('Setup successfully created!');
      setHardwareIdsInput('');
      setImageIdsInput('');
      setDetails('');
    } catch (error) {
      console.error('Failed to create setup:', error);
      setErrorMessage('Failed to create setup. Please try again later.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-100">
      {/* Left Column */}
      <div className="flex flex-col space-y-6">
        <div>
          <label className="block text-gray-600 font-medium mb-1">Hardware Components (IDs)</label>
          <input
            type="text"
            value={hardwareIdsInput}
            onChange={(e) => setHardwareIdsInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Enter hardware IDs separated by commas (e.g., 1, 2, 3)"
          />
        </div>

        <div>
          <label className="block text-gray-600 font-medium mb-1">Images (IDs)</label>
          <input
            type="text"
            value={imageIdsInput}
            onChange={(e) => setImageIdsInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Enter image IDs separated by commas (e.g., 101, 102)"
          />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col justify-between">
        <div>
          <label className="block text-gray-600 font-medium mb-1">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full h-64 px-4 py-2 border border-gray-300 rounded-md"
            placeholder="Add detailed description about the setup..."
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-500 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-600 transition-colors duration-300"
        >
          Submit
        </button>
      </div>

      {/* Display Hardware Components and Images */}
      <div className="col-span-1 lg:col-span-2">
        <h2 className="text-lg font-medium mb-2">Hardware Components</h2>
        {hardwareComponents.length > 0 ? (
          <ul className="list-disc list-inside bg-white p-4 rounded-md shadow-md">
            {hardwareComponents.map((component) => (
              <li key={component.id}>
                <span className="font-semibold">ID:</span> {component.id}, <span className="font-semibold">Name:</span> {component.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hardware components available.</p>
        )}

        <h2 className="text-lg font-medium mt-4 mb-2">Images</h2>
        {images.length > 0 ? (
          <ul className="list-disc list-inside bg-white p-4 rounded-md shadow-md">
            {images.map((image) => (
              <li key={image.id}>
                <span className="font-semibold">ID:</span> {image.id}, <span className="font-semibold">Details:</span> {image.details}
              </li>
            ))}
          </ul>
        ) : (
          <p>No images available.</p>
        )}
      </div>

      {/* Feedback Messages */}
      <div className="col-span-1 lg:col-span-2 mt-4">
        {errorMessage && (
          <div className="text-red-500 font-medium bg-red-100 p-3 rounded-md">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="text-green-500 font-medium bg-green-100 p-3 rounded-md">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNewSetupForm;















