interface Comment {
  setupId: number; // Use `setupId` to match backend's naming convention
  content: string;
}

const AddComment = async (comment: Comment) => {
  try {
    // Retrieve token from session storage
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.warn('Unauthorized: No token found in session storage');
      return { error: 'Unauthorized. Please log in to add a comment.' };
    }

    if (
      typeof comment.setupId !== 'number' ||
      typeof comment.content !== 'string' ||
      comment.content.trim() === ''
    ) {
      throw new Error("Invalid comment format");
    }

    console.log("Sending comment to backend:", comment);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Include the token in the headers
      },
      body: JSON.stringify(comment),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error('Error response from backend:', errorDetails);
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Comment successfully added:", data);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error adding comment:', error.message);
    } else {
      console.error('Error adding comment:', error);
    }
    throw error;
  }
};

export default {
  AddComment,
};



  