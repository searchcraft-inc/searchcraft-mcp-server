// Mock data fixtures for tests

export const mockIndexSchema = {
  id: { type: 'u64', indexed: true, stored: true },
  title: { type: 'text', indexed: true, stored: true },
  description: { type: 'text', indexed: true, stored: true },
  price: { type: 'f64', indexed: true, stored: true },
  category: { type: 'text', indexed: true, stored: true, fast: true }
};

export const mockDocuments = [
  {
    id: 1,
    title: 'Test Product 1',
    description: 'A great test product',
    price: 99.99,
    category: 'electronics'
  },
  {
    id: 2,
    title: 'Test Product 2',
    description: 'Another test product',
    price: 149.99,
    category: 'books'
  }
];

export const mockSearchResponse = {
  hits: [
    {
      id: '1',
      score: 1.5,
      document: mockDocuments[0]
    }
  ],
  total: 1,
  took: 5
};

export const mockIndexConfig = {
  name: 'test-index',
  schema: mockIndexSchema,
  settings: {
    default_search_fields: ['title', 'description']
  }
};

export const mockKeyData = {
  name: 'test-key',
  permissions: {
    read: true,
    write: false
  },
  indexes: ['test-index']
};

export const mockAnalyzedJson = {
  fields: {
    id: {
      type: 'number',
      samples: [1, 2, 3],
      isInteger: true
    },
    title: {
      type: 'string',
      samples: ['Product 1', 'Product 2']
    },
    price: {
      type: 'number',
      samples: [99.99, 149.99],
      isInteger: false
    }
  },
  totalRecords: 2,
  sampleSize: 2
};

