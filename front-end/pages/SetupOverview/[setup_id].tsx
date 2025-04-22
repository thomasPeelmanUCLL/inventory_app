import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { Setup } from '@types';
import Header from '@components/header';
import SetupService from '@services/SetupService';
import CommentService from '@services/CommentService';

type Props = {
  setup: Setup | null;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const SetupDetailsPage: React.FC<Props> = ({ setup }) => {
  const router = useRouter();
  const { setup_id } = router.query;

  const [comments, setComments] = useState(setup?.comments || []);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async () => {
    try {
      if (!newComment.trim()) {
        throw new Error('Comment cannot be empty');
      }
  
      const commentData = {
        setupId: Number(setup_id), // Ensure the property name matches backend
        content: newComment,
      };
  
      const newCommentData = await CommentService.AddComment(commentData);
      setComments([...comments, newCommentData]); // Add the new comment to the state
      setNewComment(''); // Clear the input field
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
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
    <div className="grid grid-cols-3 gap-4 p-4">
      {/* Main Content */}
      <div className="col-span-2 bg-gray-100 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">Setup Details for ID: {setup_id}</h1>
        <h2 className="text-lg font-semibold">Owner: {setup.owner.name}</h2>
        <h3 className="mt-4 text-xl font-medium">Hardware Components:</h3>
        <ul className="list-disc list-inside mt-2">
          {setup.hardware_components.map((component, idx) => (
            <li key={idx} className="mt-1">
              <strong>{component.name}</strong> - {component.details} (${component.price})
            </li>
          ))}
        </ul>
        <h3 className="mt-4 text-xl font-medium">Image URLs:</h3>
        <ul className="list-disc list-inside mt-2">
          {setup.image_urls.map((image, idx) => (
            <li key={idx} className="mt-1">
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {image.details}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4">{setup.details}</p>
        <p className="mt-4 text-sm text-gray-600">
          Last Updated: {formatDate(setup.last_updated)}
        </p>
      </div>

      {/* Comments Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-medium">Comments</h3>
        <ul className="mt-4 space-y-2">
          {comments.map((comment, idx) => (
            <li
              key={idx}
              className="p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200"
            >
              <strong>User {comment.user_id}:</strong> {comment.content}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment here..."
            className="w-full p-2 border border-gray-300 rounded-md resize-none h-28"
          />
          <button
            onClick={handleAddComment}
            className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Post
          </button>
        </div>
      </div>
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

export default SetupDetailsPage;









