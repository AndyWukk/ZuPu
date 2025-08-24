const API_BASE_URL = 'http://localhost:3001/api'

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token')
}

// Create headers with auth token
const createHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers
    }
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Genealogy API
export const genealogyAPI = {
  // Get all genealogies for current user
  getAll: () => apiRequest('/genealogies'),

  // Get genealogy by ID
  getById: (id: string) => apiRequest(`/genealogies/${id}`),

  // Create new genealogy
  create: (data: { name: string; description?: string; is_public?: boolean }) =>
    apiRequest('/genealogies', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Update genealogy
  update: (id: string, data: { name: string; description?: string; is_public?: boolean }) =>
    apiRequest(`/genealogies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Delete genealogy
  delete: (id: string) =>
    apiRequest(`/genealogies/${id}`, {
      method: 'DELETE'
    }),

  // Get genealogy persons
  getPersons: (id: string) => apiRequest(`/genealogies/${id}/persons`)
}

// Person API
export const personAPI = {
  // Get person by ID
  getById: (id: string) => apiRequest(`/persons/${id}`),

  // Create new person
  create: (data: {
    genealogy_id: string
    name: string
    gender?: 'male' | 'female'
    birth_date?: string
    death_date?: string
    birth_place?: string
    death_place?: string
    occupation?: string
    education?: string
    biography?: string
  }) =>
    apiRequest('/persons', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Update person
  update: (id: string, data: {
    name: string
    gender?: 'male' | 'female'
    birth_date?: string
    death_date?: string
    birth_place?: string
    death_place?: string
    occupation?: string
    education?: string
    biography?: string
  }) =>
    apiRequest(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Delete person
  delete: (id: string) =>
    apiRequest(`/persons/${id}`, {
      method: 'DELETE'
    }),

  // Get person relationships
  getRelationships: (id: string) => apiRequest(`/persons/${id}/relationships`),

  // Create relationship
  createRelationship: (id: string, data: {
    person2_id: string
    relationship_type: 'parent' | 'child' | 'spouse' | 'sibling'
  }) =>
    apiRequest(`/persons/${id}/relationships`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Delete relationship
  deleteRelationship: (personId: string, relationshipId: string) =>
    apiRequest(`/persons/${personId}/relationships/${relationshipId}`, {
      method: 'DELETE'
    })
}

// Types
export interface Genealogy {
  id: string
  name: string
  description?: string
  is_public: boolean
  creator_id: string
  person_count?: number
  created_at: string
  updated_at: string
}

export interface Person {
  id: string
  genealogy_id: string
  name: string
  gender?: 'male' | 'female'
  birth_date?: string
  death_date?: string
  birth_place?: string
  death_place?: string
  occupation?: string
  education?: string
  biography?: string
  created_at: string
  updated_at: string
}

export interface Relationship {
  id: string
  person1_id: string
  person2_id: string
  relationship_type: 'parent' | 'child' | 'spouse' | 'sibling'
  created_at: string
  person1?: Person
  person2?: Person
}