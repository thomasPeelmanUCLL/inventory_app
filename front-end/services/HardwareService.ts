const HardwareService = {
  async getHardwareComponents() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.warn('Unauthorized: No token found in session storage');
        return { error: 'Unauthorized, log in with a valid account to see hardware components' };
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hardwareComponents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hardware components: ${response.statusText}`);
      }

      const data = await response.json();

      const normalizedData = data.map((component: any) => ({
        id: component.id,
        name: component.name,
        type: component.type,
        specs: component.specs,
      }));

      return normalizedData;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching hardware components:', error.message);
      } else {
        console.error('Error fetching hardware components:', error);
      }
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
};

export default HardwareService;
  
  