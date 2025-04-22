import React from 'react';
import { useRouter } from 'next/router';
import { Setup } from '@types';

type Props = {
  setups: Setup[];
  selectsetups: (setup: Setup) => void;
};

const SetupOverviewTable: React.FC<Props> = ({ setups, selectsetups }) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {setups.map((setup, index) => (
        <div
          key={index}
          className="bg-gray-100 p-6 rounded-lg shadow hover:shadow-md cursor-pointer transition"
          onClick={() => {
            router.push(`/SetupOverview/${setup.setup_id}`);
            selectsetups(setup);
          }}
        >
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            Setup ID: {setup.setup_id}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Owner:</strong> {setup.owner.name}
          </p>
          <div className="mb-4">
            <h3 className="text-gray-700 font-medium">Hardware Components:</h3>
            <ul className="list-disc list-inside">
              {setup.hardware_components.map((component, idx) => (
                <li key={idx} className="text-sm text-gray-600">
                  <strong>{component.name}</strong> - {component.details} (${component.price})
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="text-gray-700 font-medium">Images:</h3>
            <ul className="list-disc list-inside">
              {setup.image_urls.map((image, idx) => (
                <li key={idx} className="text-sm text-blue-500 hover:underline">
                  <a href={image.url} target="_blank" rel="noopener noreferrer">
                    {image.details}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Details:</strong> {setup.details}
          </p>
          <p className="text-sm text-gray-500">
            <strong>Last Updated:</strong>{' '}
            {new Date(setup.last_updated).toLocaleDateString()}
          </p>
          <div className="mt-4">
            <h3 className="text-gray-700 font-medium">Comments:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {setup.comments && setup.comments.length > 0 ? (
                setup.comments.map((comment, idx) => (
                  <li key={idx}>
                    <strong>User {comment.user_id}:</strong> {comment.content}
                  </li>
                ))
              ) : (
                <li>No comments available</li>
              )}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SetupOverviewTable;





