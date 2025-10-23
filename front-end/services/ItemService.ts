interface ItemInput {
  name: string;
  description: string;
  price: number;
  quantity: number;
  buyedAt?: string;
  inventoryId?: number;
}

const getAllItems = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching items:', error.message);
    } else {
      console.error('Error fetching items:', error);
    }
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

const getItemById = async (id: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch item: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching item:', error.message);
    } else {
      console.error('Error fetching item:', error);
    }
    throw error;
  }
};

const createItem = async (item: ItemInput) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Failed to create item: ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};

const updateItem = async (id: number, updatedItem: Partial<ItemInput>) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedItem),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error('Error response from backend:', errorDetails);
      throw new Error(`Failed to update item: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Item successfully updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
};

const deleteItem = async (id: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Failed to delete item: ${errorDetails}`);
    }

    return true; // Successfully deleted
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};

const ItemService = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};

export default ItemService;
