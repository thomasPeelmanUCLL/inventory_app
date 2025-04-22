
const ImageService = {
  async getImages() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.warn('Unauthorized: No token found in session storage');
        return { error: 'Unauthorized, log in with a valid account to see images' };
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const data = await response.json();

      const normalizedData = data.map((image: any) => ({
        id: image.id,
        url: image.url,
        details: image.details,
      }));

      return normalizedData;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching images:', error.message);
      } else {
        console.error('Error fetching images:', error);
      }
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
};

export default ImageService;