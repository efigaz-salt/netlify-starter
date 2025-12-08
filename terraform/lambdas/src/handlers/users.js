/**
 * Users API Handler - Mock MuleSoft User Service
 */

// Mock user data (simulates database)
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', createdAt: '2024-01-15T10:00:00Z', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', createdAt: '2024-02-20T14:30:00Z', status: 'active' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'user', createdAt: '2024-03-10T09:15:00Z', status: 'inactive' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'moderator', createdAt: '2024-04-05T11:45:00Z', status: 'active' },
  { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', role: 'user', createdAt: '2024-05-12T16:20:00Z', status: 'active' },
];

// Response helper
const response = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
});

// Handler
exports.handle = async (ctx) => {
  const { method, path, pathParameters, query, body } = ctx;

  // GET /users - List all users
  if (path === '/users' && method === 'GET') {
    let result = [...users];

    // Filter by role
    if (query.role) {
      result = result.filter(u => u.role === query.role);
    }

    // Filter by status
    if (query.status) {
      result = result.filter(u => u.status === query.status);
    }

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const start = (page - 1) * limit;
    const paged = result.slice(start, start + limit);

    return response(200, {
      users: paged,
      pagination: {
        page,
        limit,
        total: result.length,
        totalPages: Math.ceil(result.length / limit),
      },
    });
  }

  // POST /users - Create user
  if (path === '/users' && method === 'POST') {
    if (!body || !body.name || !body.email) {
      return response(400, { error: 'Bad Request', message: 'Name and email are required' });
    }

    // Check if email exists
    if (users.find(u => u.email === body.email)) {
      return response(409, { error: 'Conflict', message: 'Email already exists' });
    }

    const newUser = {
      id: String(users.length + 1),
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    return response(201, newUser);
  }

  // GET /users/:id - Get single user
  const userIdMatch = path.match(/^\/users\/(\w+)$/);
  if (userIdMatch && method === 'GET') {
    const userId = userIdMatch[1];
    const user = users.find(u => u.id === userId);

    if (!user) {
      return response(404, { error: 'Not Found', message: `User ${userId} not found` });
    }

    return response(200, user);
  }

  // PUT /users/:id - Update user
  if (userIdMatch && method === 'PUT') {
    const userId = userIdMatch[1];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return response(404, { error: 'Not Found', message: `User ${userId} not found` });
    }

    users[userIndex] = {
      ...users[userIndex],
      ...body,
      id: userId, // Preserve ID
      updatedAt: new Date().toISOString(),
    };

    return response(200, users[userIndex]);
  }

  // DELETE /users/:id - Delete user
  if (userIdMatch && method === 'DELETE') {
    const userId = userIdMatch[1];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return response(404, { error: 'Not Found', message: `User ${userId} not found` });
    }

    users.splice(userIndex, 1);
    return response(204, null);
  }

  return response(404, { error: 'Not Found', message: 'Endpoint not found' });
};
