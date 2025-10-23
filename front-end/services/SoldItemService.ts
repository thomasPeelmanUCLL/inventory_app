const getAllSoldItems = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/soldItem`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sold items: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching sold items:', error.message);
    } else {
      console.error('Error fetching sold items:', error);
    }
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

const getSoldItemById = async (id: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/soldItem/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sold item: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching sold item:', error.message);
    } else {
      console.error('Error fetching sold item:', error);
    }
    throw error;
  }
};

const getSoldItemsByItemId = async (itemId: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/soldItem/item/${itemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sold items for item: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching sold items for item:', error.message);
    } else {
      console.error('Error fetching sold items for item:', error);
    }
    throw error;
  }
};

interface SoldItemInput {
  itemId: number;
  sellingPrice: number;
  quantity: number;
  payedCash?: boolean;
  soldAt?: string;
}

const createSoldItem = async (soldItem: SoldItemInput) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/soldItem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(soldItem),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Failed to create sold item: ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating sold item:', error);
    throw error;
  }
};

const updateSoldItem = async (id: number, updatedSoldItem: Partial<SoldItemInput>) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/soldItem/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedSoldItem),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error('Error response from backend:', errorDetails);
      throw new Error(`Failed to update sold item: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Sold item successfully updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating sold item:', error);
    throw error;
  }
};

const deleteSoldItem = async (id: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/soldItem/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Failed to delete sold item: ${errorDetails}`);
    }

    return true; // Successfully deleted
  } catch (error) {
    console.error('Error deleting sold item:', error);
    throw error;
  }
};

const SoldItemService = {
  getAllSoldItems,
  getSoldItemById,
  getSoldItemsByItemId,
  createSoldItem,
  updateSoldItem,
  deleteSoldItem,
};

export default SoldItemService;