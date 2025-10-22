const getAllInventories = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch inventories: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching inventories:', error.message);
    } else {
      console.error('Error fetching inventories:', error);
    }
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

const getInventoryById = async (id: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching inventory:', error.message);
    } else {
      console.error('Error fetching inventory:', error);
    }
    throw error;
  }
};

const createInventory = async (inventory: { name: string; description: string }) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventory),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Failed to create inventory: ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw error;
  }
};

const updateInventory = async (id: number, updatedInventory: { name: string; description: string }) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedInventory),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error('Error response from backend:', errorDetails);
      throw new Error(`Failed to update inventory: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Inventory successfully updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

const deleteInventory = async (id: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Failed to delete inventory: ${errorDetails}`);
    }

    return true; // Successfully deleted
  } catch (error) {
    console.error('Error deleting inventory:', error);
    throw error;
  }
};

const addItemToInventory = async (inventoryId: number, itemId: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/${inventoryId}/items/${itemId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Failed to add item to inventory: ${errorDetails}`);
    }

    return true; // Successfully added
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    throw error;
  }
};

const InventoryService = {
  getAllInventories,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  addItemToInventory,
};

export default InventoryService;
