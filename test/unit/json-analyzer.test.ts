import { describe, it, expect } from 'vitest';
import {
  analyzeJsonStructure,
  extractContentArray,
  findArraysInObject,
  flattenDocumentForSearchcraft
} from '../../src/tools/import/json-analyzer';

describe('analyzeJsonStructure', () => {
  it('should analyze simple JSON array structure', () => {
    const data = [
      { id: 1, name: 'Product 1', price: 99.99 },
      { id: 2, name: 'Product 2', price: 149.99 }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.total_objects_analyzed).toBe(2);
    expect(result.fields).toHaveProperty('id');
    expect(result.fields).toHaveProperty('name');
    expect(result.fields).toHaveProperty('price');
  });

  it('should detect correct Searchcraft types', () => {
    const data = [
      {
        id: 1,
        title: 'Test Product',
        price: 99.99,
        stock: 10,
        available: true,
        created: '2024-01-01T00:00:00Z'
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.fields.id.searchcraft_type).toBe('u64');
    expect(result.fields.title.searchcraft_type).toBe('text');
    expect(result.fields.price.searchcraft_type).toBe('f64');
    expect(result.fields.stock.searchcraft_type).toBe('u64');
    expect(result.fields.available.searchcraft_type).toBe('bool');
    expect(result.fields.created.searchcraft_type).toBe('datetime');
  });

  it('should identify text fields for search', () => {
    const data = [
      {
        title: 'Product Title',
        description: 'Product description',
        price: 99.99
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.suggested_search_fields).toContain('title');
    expect(result.suggested_search_fields).toContain('description');
    expect(result.suggested_search_fields).not.toContain('price');
  });

  it('should suggest weight multipliers for important fields', () => {
    const data = [
      {
        title: 'Product Title',
        description: 'Product description'
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.suggested_weight_multipliers.title).toBe(2.0);
    expect(result.suggested_weight_multipliers.description).toBe(0.5);
  });

  it('should detect array fields', () => {
    const data = [
      {
        tags: ['electronics', 'gadgets'],
        ratings: [4.5, 5.0, 4.0]
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.fields.tags.is_array).toBe(true);
    expect(result.fields.ratings.is_array).toBe(true);
    expect(result.fields.tags.suggested_config.multi).toBe(true);
  });

  it('should mark required fields based on name patterns', () => {
    const data = [
      {
        id: 1,
        title: 'Product',
        description: 'Description'
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.fields.id.is_required).toBe(true);
    expect(result.fields.title.is_required).toBe(true);
    expect(result.fields.description.is_required).toBe(false);
  });

  it('should handle nested objects by flattening', () => {
    const data = [
      {
        product: {
          name: 'Test',
          price: 99.99
        }
      }
    ];

    const result = analyzeJsonStructure(data);

    // Should have flattened field names
    expect(result.fields).toHaveProperty('product');
  });

  it('should detect facet fields from category-like names', () => {
    const data = [
      {
        category: 'Electronics/Computers/Laptops'
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.fields.category.searchcraft_type).toBe('facet');
  });

  it('should handle decimal field patterns correctly', () => {
    const data = [
      {
        price: 100,
        discountPercentage: 15,
        stock: 50
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.fields.price.searchcraft_type).toBe('f64');
    expect(result.fields.discountPercentage.searchcraft_type).toBe('f64');
    expect(result.fields.stock.searchcraft_type).toBe('u64');
  });

  it('should suggest fast fields for numeric types', () => {
    const data = [
      {
        price: 99.99,
        stock: 10,
        created: '2024-01-01'
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.fields.price.suggested_config.fast).toBe(true);
    expect(result.fields.stock.suggested_config.fast).toBe(true);
    expect(result.fields.created.suggested_config.fast).toBe(true);
  });

  it('should not index ID and URL fields', () => {
    const data = [
      {
        id: 1,
        url: 'https://example.com',
        image: 'image.jpg'
      }
    ];

    const result = analyzeJsonStructure(data);

    expect(result.fields.id.suggested_config.indexed).toBe(false);
    expect(result.fields.url.suggested_config.indexed).toBe(false);
    expect(result.fields.image.suggested_config.indexed).toBe(false);
  });
});

describe('extractContentArray', () => {
  it('should return array as-is when input is array', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = extractContentArray(data);

    expect(result).toEqual(data);
  });

  it('should extract array from nested object', () => {
    const data = {
      results: [{ id: 1 }, { id: 2 }]
    };
    const result = extractContentArray(data);

    expect(result).toEqual(data.results);
  });

  it('should prefer shallowest array', () => {
    const data = {
      items: [{ id: 1 }],
      nested: {
        deep: {
          items: [{ id: 2 }, { id: 3 }]
        }
      }
    };
    const result = extractContentArray(data);

    expect(result).toEqual(data.items);
  });

  it('should prefer largest array at same depth', () => {
    const data = {
      small: [{ id: 1 }],
      large: [{ id: 1 }, { id: 2 }, { id: 3 }]
    };
    const result = extractContentArray(data);

    expect(result).toEqual(data.large);
  });

  it('should wrap single object in array', () => {
    const data = { id: 1, name: 'Test' };
    const result = extractContentArray(data);

    expect(result).toEqual([data]);
  });

  it('should throw error for invalid input', () => {
    expect(() => extractContentArray(null)).toThrow();
    expect(() => extractContentArray('string')).toThrow();
    expect(() => extractContentArray(123)).toThrow();
  });
});

describe('findArraysInObject', () => {
  it('should find all arrays in object', () => {
    const obj = {
      items: [1, 2, 3],
      nested: {
        data: [4, 5, 6]
      }
    };

    const result = findArraysInObject(obj);

    expect(result).toHaveLength(2);
    expect(result[0].path).toBe('items');
    expect(result[1].path).toBe('nested.data');
  });

  it('should track array depth', () => {
    const obj = {
      level1: [1],
      nested: {
        level2: [2]
      }
    };

    const result = findArraysInObject(obj);

    expect(result[0].depth).toBe(0);
    expect(result[1].depth).toBe(1);
  });

  it('should respect max depth limit', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              deep: [1, 2, 3]
            }
          }
        }
      }
    };

    const result = findArraysInObject(obj, '', 0, 2);

    expect(result).toHaveLength(0); // Too deep
  });

  it('should return empty array for objects without arrays', () => {
    const obj = { name: 'Test', value: 123 };
    const result = findArraysInObject(obj);

    expect(result).toEqual([]);
  });
});

describe('flattenDocumentForSearchcraft', () => {
  it('should flatten nested objects', () => {
    const doc = {
      product: {
        name: 'Test',
        price: 99.99
      }
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result).toHaveProperty('product.name', 'Test');
    expect(result).toHaveProperty('product.price', 99.99);
  });

  it('should keep primitive arrays', () => {
    const doc = {
      tags: ['electronics', 'gadgets']
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result.tags).toEqual(['electronics', 'gadgets']);
  });

  it('should skip null and undefined values', () => {
    const doc = {
      name: 'Test',
      nullValue: null,
      undefinedValue: undefined
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result).toHaveProperty('name');
    expect(result).not.toHaveProperty('nullValue');
    expect(result).not.toHaveProperty('undefinedValue');
  });

  it('should skip empty strings', () => {
    const doc = {
      name: 'Test',
      empty: '',
      whitespace: '   '
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result).toHaveProperty('name');
    expect(result).not.toHaveProperty('empty');
    expect(result).not.toHaveProperty('whitespace');
  });

  it('should filter null values from arrays', () => {
    const doc = {
      tags: ['valid', null, 'also-valid', undefined]
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result.tags).toEqual(['valid', 'also-valid']);
  });

  it('should skip arrays of objects', () => {
    const doc = {
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result).not.toHaveProperty('items');
  });

  it('should handle invalid numbers', () => {
    const doc = {
      valid: 123,
      nan: NaN,
      infinity: Infinity
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result).toHaveProperty('valid', 123);
    expect(result).not.toHaveProperty('nan');
    expect(result).not.toHaveProperty('infinity');
  });

  it('should keep boolean values', () => {
    const doc = {
      available: true,
      featured: false
    };

    const result = flattenDocumentForSearchcraft(doc);

    expect(result.available).toBe(true);
    expect(result.featured).toBe(false);
  });
});

