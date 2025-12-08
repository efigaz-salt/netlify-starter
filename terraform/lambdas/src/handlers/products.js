/**
 * Products API Handler - Mock Product Catalog Service
 */

// Response helper
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});

// Mock product data
const products = [
  {
    id: 'prod-001',
    sku: 'WP-001',
    name: 'Widget Pro',
    description: 'Professional-grade widget for enterprise use',
    price: 99.99,
    currency: 'USD',
    category: 'electronics',
    subcategory: 'widgets',
    brand: 'TechCorp',
    inStock: true,
    stockQuantity: 150,
    images: ['https://example.com/images/widget-pro-1.jpg'],
    rating: 4.5,
    reviewCount: 128,
    tags: ['professional', 'enterprise', 'best-seller'],
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'prod-002',
    sku: 'GP-002',
    name: 'Gadget Plus',
    description: 'Enhanced gadget with advanced features',
    price: 149.99,
    currency: 'USD',
    category: 'electronics',
    subcategory: 'gadgets',
    brand: 'TechCorp',
    inStock: true,
    stockQuantity: 75,
    images: ['https://example.com/images/gadget-plus-1.jpg'],
    rating: 4.8,
    reviewCount: 256,
    tags: ['premium', 'featured', 'new-arrival'],
    createdAt: '2024-02-20T00:00:00Z',
  },
  {
    id: 'prod-003',
    sku: 'TM-003',
    name: 'Tool Master',
    description: 'Multi-purpose tool for professionals',
    price: 79.99,
    currency: 'USD',
    category: 'tools',
    subcategory: 'multi-tools',
    brand: 'ToolWorks',
    inStock: false,
    stockQuantity: 0,
    images: ['https://example.com/images/tool-master-1.jpg'],
    rating: 4.2,
    reviewCount: 89,
    tags: ['professional', 'multi-purpose'],
    createdAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'prod-004',
    sku: 'SS-004',
    name: 'Smart Sensor',
    description: 'IoT-enabled smart sensor with cloud connectivity',
    price: 59.99,
    currency: 'USD',
    category: 'electronics',
    subcategory: 'sensors',
    brand: 'SmartHome',
    inStock: true,
    stockQuantity: 200,
    images: ['https://example.com/images/smart-sensor-1.jpg'],
    rating: 4.6,
    reviewCount: 167,
    tags: ['smart-home', 'iot', 'connected'],
    createdAt: '2024-04-05T00:00:00Z',
  },
  {
    id: 'prod-005',
    sku: 'PK-005',
    name: 'Power Kit',
    description: 'Complete power solution kit',
    price: 199.99,
    currency: 'USD',
    category: 'electronics',
    subcategory: 'power',
    brand: 'PowerUp',
    inStock: true,
    stockQuantity: 50,
    images: ['https://example.com/images/power-kit-1.jpg'],
    rating: 4.4,
    reviewCount: 72,
    tags: ['power', 'kit', 'complete-solution'],
    createdAt: '2024-05-12T00:00:00Z',
  },
];

// Categories
const categories = [
  { id: 'electronics', name: 'Electronics', productCount: 4 },
  { id: 'tools', name: 'Tools', productCount: 1 },
];

// Handler
exports.handle = async (ctx) => {
  const { method, path, query, body } = ctx;

  // GET /products - List products
  if (path === '/products' && method === 'GET') {
    let result = [...products];

    // Filter by category
    if (query.category) {
      result = result.filter(p => p.category === query.category);
    }

    // Filter by in stock
    if (query.inStock !== undefined) {
      const inStockFilter = query.inStock === 'true';
      result = result.filter(p => p.inStock === inStockFilter);
    }

    // Filter by price range
    if (query.minPrice) {
      result = result.filter(p => p.price >= parseFloat(query.minPrice));
    }
    if (query.maxPrice) {
      result = result.filter(p => p.price <= parseFloat(query.maxPrice));
    }

    // Filter by brand
    if (query.brand) {
      result = result.filter(p => p.brand.toLowerCase() === query.brand.toLowerCase());
    }

    // Search by name/description
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (query.sort) {
      const [field, order] = query.sort.split(':');
      result.sort((a, b) => {
        if (order === 'desc') {
          return b[field] > a[field] ? 1 : -1;
        }
        return a[field] > b[field] ? 1 : -1;
      });
    }

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const start = (page - 1) * limit;
    const paged = result.slice(start, start + limit);

    return response(200, {
      products: paged,
      pagination: {
        page,
        limit,
        total: result.length,
        totalPages: Math.ceil(result.length / limit),
      },
      filters: {
        categories: [...new Set(products.map(p => p.category))],
        brands: [...new Set(products.map(p => p.brand))],
        priceRange: {
          min: Math.min(...products.map(p => p.price)),
          max: Math.max(...products.map(p => p.price)),
        },
      },
    });
  }

  // GET /products/categories - List categories
  if (path === '/products/categories' && method === 'GET') {
    return response(200, { categories });
  }

  // GET /products/featured - Featured products
  if (path === '/products/featured' && method === 'GET') {
    const featured = products.filter(p => p.tags.includes('featured') || p.tags.includes('best-seller'));
    return response(200, { products: featured, total: featured.length });
  }

  // GET /products/:id - Get single product
  const productIdMatch = path.match(/^\/products\/(prod-\d+|[a-z0-9-]+)$/);
  if (productIdMatch && method === 'GET') {
    const productId = productIdMatch[1];
    const product = products.find(p => p.id === productId || p.sku === productId);

    if (!product) {
      return response(404, { error: 'Not Found', message: `Product ${productId} not found` });
    }

    // Add related products
    const related = products
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, 3);

    return response(200, { ...product, relatedProducts: related });
  }

  // POST /products/:id/reviews - Add review (mock)
  const reviewMatch = path.match(/^\/products\/(prod-\d+)\/reviews$/);
  if (reviewMatch && method === 'POST') {
    const productId = reviewMatch[1];
    const product = products.find(p => p.id === productId);

    if (!product) {
      return response(404, { error: 'Not Found', message: `Product ${productId} not found` });
    }

    if (!body || !body.rating || !body.comment) {
      return response(400, { error: 'Bad Request', message: 'Rating and comment are required' });
    }

    const review = {
      id: `rev-${Date.now()}`,
      productId,
      rating: body.rating,
      comment: body.comment,
      author: body.author || 'Anonymous',
      createdAt: new Date().toISOString(),
    };

    return response(201, review);
  }

  // POST /products/inventory/check - Check inventory
  if (path === '/products/inventory/check' && method === 'POST') {
    const items = body?.items || [];
    const results = items.map(item => {
      const product = products.find(p => p.id === item.productId || p.sku === item.sku);
      if (!product) {
        return { ...item, available: false, reason: 'PRODUCT_NOT_FOUND' };
      }
      const requestedQty = item.quantity || 1;
      return {
        productId: product.id,
        sku: product.sku,
        requestedQuantity: requestedQty,
        available: product.inStock && product.stockQuantity >= requestedQty,
        stockQuantity: product.stockQuantity,
        reason: !product.inStock ? 'OUT_OF_STOCK' : product.stockQuantity < requestedQty ? 'INSUFFICIENT_STOCK' : 'AVAILABLE',
      };
    });

    return response(200, { results, timestamp: new Date().toISOString() });
  }

  return response(404, { error: 'Not Found', message: 'Products endpoint not found' });
};
