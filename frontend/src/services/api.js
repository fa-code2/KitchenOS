const API_BASE = '/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('kitchenos_auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // Authentication & Users
  auth: {
    register: async (email, password, fullName = '') => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      return data;
    },

    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid email or password');
      }
      return data;
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      if (!res.ok) throw new Error('Failed to fetch user profile');
      return res.json();
    }
  },

  // Pantry
  getPantryItems: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.location) params.append('location', filters.location);
    if (filters.category) params.append('category', filters.category);
    if (filters.urgency) params.append('urgency', filters.urgency);
    if (filters.search) params.append('search', filters.search);
    const res = await fetch(`${API_BASE}/pantry?${params.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch pantry items');
    return res.json();
  },

  createPantryItem: async (item) => {
    const res = await fetch(`${API_BASE}/pantry`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to create pantry item');
    return res.json();
  },

  bulkImportScanned: async (items) => {
    const res = await fetch(`${API_BASE}/pantry/bulk-import`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Failed to import scanned items');
    return res.json();
  },

  updatePantryItem: async (id, data) => {
    const res = await fetch(`${API_BASE}/pantry/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update pantry item');
    return res.json();
  },

  deletePantryItem: async (id) => {
    const res = await fetch(`${API_BASE}/pantry/${id}`, { 
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to delete pantry item');
    return res.json();
  },

  consumePantryItem: async (id, quantity = null) => {
    const q = quantity ? `?quantity=${quantity}` : '';
    const res = await fetch(`${API_BASE}/pantry/${id}/consume${q}`, { 
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to consume pantry item');
    return res.json();
  },

  wastePantryItem: async (id) => {
    const res = await fetch(`${API_BASE}/pantry/${id}/waste`, { 
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to mark pantry item as wasted');
    return res.json();
  },

  // Vision
  scanGroceryImage: async (formData) => {
    const res = await fetch(`${API_BASE}/vision/scan`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    if (!res.ok) throw new Error('Vision scan failed');
    return res.json();
  },

  // Zero-Waste Chef Recipes
  getZeroWasteRecipes: async () => {
    const res = await fetch(`${API_BASE}/recipes/zero-waste`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to generate recipes');
    return res.json();
  },

  generateZeroWasteRecipesWithItems: async (items) => {
    const res = await fetch(`${API_BASE}/recipes/zero-waste`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Failed to generate recipes');
    return res.json();
  },

  cookRecipe: async (recipeTitle, ingredientsToDeduct) => {
    const res = await fetch(`${API_BASE}/recipes/cook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        recipe_title: recipeTitle,
        ingredients_to_deduct: ingredientsToDeduct
      })
    });
    if (!res.ok) throw new Error('Failed to log cooked recipe');
    return res.json();
  },

  // Meal Planner
  getWeeklyMealPlan: async () => {
    const res = await fetch(`${API_BASE}/meal-plan`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load meal plan');
    return res.json();
  },

  createMealPlanEntry: async (entry) => {
    const res = await fetch(`${API_BASE}/meal-plan`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to add meal plan entry');
    return res.json();
  },

  deleteMealPlanEntry: async (id) => {
    const res = await fetch(`${API_BASE}/meal-plan/${id}`, { 
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to delete meal plan');
    return res.json();
  },

  generateGroceryFromMealPlan: async () => {
    const res = await fetch(`${API_BASE}/meal-plan/generate-grocery-list`, { 
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to push missing ingredients to grocery list');
    return res.json();
  },

  // Dynamic Grocery Agent
  getGroceryList: async () => {
    const res = await fetch(`${API_BASE}/grocery`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch grocery list');
    return res.json();
  },

  addGroceryItem: async (item) => {
    const res = await fetch(`${API_BASE}/grocery`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error('Failed to add grocery item');
    return res.json();
  },

  updateGroceryItem: async (id, data) => {
    const res = await fetch(`${API_BASE}/grocery/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update grocery item');
    return res.json();
  },

  deleteGroceryItem: async (id) => {
    const res = await fetch(`${API_BASE}/grocery/${id}`, { 
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to delete grocery item');
    return res.json();
  },

  autoGenerateStaples: async () => {
    const res = await fetch(`${API_BASE}/grocery/auto-generate`, { 
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to generate staples');
    return res.json();
  },

  getBehaviorSuggestions: async () => {
    const res = await fetch(`${API_BASE}/grocery/behavior-suggestions`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to fetch behavior suggestions');
    return res.json();
  },

  restockToPantry: async (itemIds, targetLocation = 'Fridge') => {
    const res = await fetch(`${API_BASE}/grocery/restock`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ item_ids: itemIds, target_location: targetLocation })
    });
    if (!res.ok) throw new Error('Failed to restock items into pantry');
    return res.json();
  },

  // Second Life Hub
  getSecondLifeGuides: async () => {
    const res = await fetch(`${API_BASE}/second-life`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load second life guides');
    return res.json();
  },

  getPantryMatchedGuides: async () => {
    const res = await fetch(`${API_BASE}/second-life/for-pantry`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load matched guides');
    return res.json();
  },

  querySecondLife: async (query) => {
    const res = await fetch(`${API_BASE}/second-life/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Failed to query second life guide');
    return res.json();
  },

  // Analytics
  getAnalyticsSummary: async () => {
    const res = await fetch(`${API_BASE}/analytics/summary`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  // Voice Inventory Logging & Quick Updates (ElevenLabs Audio)
  voice: {
    sendCommand: async (transcript) => {
      const res = await fetch(`${API_BASE}/voice/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ transcript })
      });
      if (!res.ok) throw new Error('Failed to process voice command');
      return res.json();
    },

    sendAudioCommand: async (audioBlob, filename = 'voice_command.wav') => {
      const formData = new FormData();
      formData.append('file', audioBlob, filename);
      const res = await fetch(`${API_BASE}/voice/audio-command`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to process voice audio command');
      return res.json();
    },

    synthesizeSpeech: async (text) => {
      const res = await fetch(`${API_BASE}/voice/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error('Failed to synthesize speech');
      return res.blob();
    }
  }
};
