/**
 * Binary Content Handler
 * Serves different types of binary content for testing how collectors handle binary data
 */

// Response helper for binary content
const binaryResponse = (statusCode, contentType, base64Body, additionalHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key,X-Trace-ID',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...additionalHeaders,
  },
  body: base64Body,
  isBase64Encoded: true,
});

// JSON response helper
const jsonResponse = (statusCode, body, additionalHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-API-Key,X-Trace-ID',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...additionalHeaders,
  },
  body: JSON.stringify(body),
});

// Generate a 1x1 PNG pixel (red)
const generatePNG = () => {
  // 1x1 red PNG - 67 bytes
  const pngBytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
    0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  return pngBytes.toString('base64');
};

// Generate a JPEG (1x1 pixel)
const generateJPEG = () => {
  // 1x1 JPEG - minimal valid JPEG
  const jpegBytes = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, // JFIF header
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03,
    0x03, 0x03, 0x03, 0x04, 0x03, 0x03, 0x04, 0x05,
    0x08, 0x05, 0x05, 0x04, 0x04, 0x05, 0x0a, 0x07,
    0x07, 0x06, 0x08, 0x0c, 0x0a, 0x0c, 0x0c, 0x0b,
    0x0a, 0x0b, 0x0b, 0x0d, 0x0e, 0x12, 0x10, 0x0d,
    0x0e, 0x11, 0x0e, 0x0b, 0x0b, 0x10, 0x16, 0x10,
    0x11, 0x13, 0x14, 0x15, 0x15, 0x15, 0x0c, 0x0f,
    0x17, 0x18, 0x16, 0x14, 0x18, 0x12, 0x14, 0x15,
    0x14, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
    0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x03, 0xff, 0xc4, 0x00, 0x14,
    0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9
  ]);
  return jpegBytes.toString('base64');
};

// Generate a minimal PDF
const generatePDF = (sizeKB = 1) => {
  const content = 'X'.repeat(Math.max(0, sizeKB * 1024 - 200)); // Padding
  const pdf = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length ${content.length + 50}
>>
stream
BT
/F1 12 Tf
100 700 Td
(Binary Test PDF ${sizeKB}KB) Tj
ET
${content}
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${400 + content.length}
%%EOF`;
  return Buffer.from(pdf).toString('base64');
};

// Generate binary data (random bytes)
const generateBinaryData = (sizeKB) => {
  const buffer = Buffer.alloc(sizeKB * 1024);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer.toString('base64');
};

// Generate ZIP file
const generateZIP = () => {
  // Minimal empty ZIP file (22 bytes)
  const zipBytes = Buffer.from([
    0x50, 0x4b, 0x05, 0x06, // End of central directory signature
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
  ]);
  return zipBytes.toString('base64');
};

// Main handler
exports.handle = async (ctx) => {
  const { path, method, query } = ctx;

  // Handle POST requests with binary content
  if (method === 'POST') {
    const contentType = ctx.headers['content-type'] || 'application/octet-stream';
    const body = ctx.body;

    return jsonResponse(200, {
      message: 'Binary content received',
      contentType,
      receivedBodyType: typeof body,
      bodySize: body ? (typeof body === 'string' ? body.length : JSON.stringify(body).length) : 0,
      isBase64: ctx.headers['content-transfer-encoding'] === 'base64',
      timestamp: new Date().toISOString(),
    });
  }

  // GET /binary/image/png
  if (path.includes('/image/png')) {
    const size = parseInt(query.size || '1', 10); // Size in KB
    if (size > 1) {
      // Generate larger PNG by adding padding
      return binaryResponse(200, 'image/png', generateBinaryData(size));
    }
    return binaryResponse(200, 'image/png', generatePNG());
  }

  // GET /binary/image/jpeg
  if (path.includes('/image/jpeg') || path.includes('/image/jpg')) {
    const size = parseInt(query.size || '1', 10);
    if (size > 1) {
      return binaryResponse(200, 'image/jpeg', generateBinaryData(size));
    }
    return binaryResponse(200, 'image/jpeg', generateJPEG());
  }

  // GET /binary/pdf
  if (path.includes('/pdf')) {
    const size = parseInt(query.size || '10', 10); // Default 10KB
    return binaryResponse(200, 'application/pdf', generatePDF(size), {
      'Content-Disposition': 'inline; filename="test.pdf"'
    });
  }

  // GET /binary/zip
  if (path.includes('/zip')) {
    const size = parseInt(query.size || '1', 10);
    if (size > 1) {
      return binaryResponse(200, 'application/zip', generateBinaryData(size), {
        'Content-Disposition': 'attachment; filename="test.zip"'
      });
    }
    return binaryResponse(200, 'application/zip', generateZIP(), {
      'Content-Disposition': 'attachment; filename="test.zip"'
    });
  }

  // GET /binary/octet-stream
  if (path.includes('/octet-stream')) {
    const size = parseInt(query.size || '10', 10);
    return binaryResponse(200, 'application/octet-stream', generateBinaryData(size));
  }

  // GET /binary/video
  if (path.includes('/video')) {
    const size = parseInt(query.size || '100', 10); // Default 100KB
    return binaryResponse(200, 'video/mp4', generateBinaryData(size), {
      'Content-Disposition': 'inline; filename="test.mp4"'
    });
  }

  // GET /binary/audio
  if (path.includes('/audio')) {
    const size = parseInt(query.size || '50', 10); // Default 50KB
    return binaryResponse(200, 'audio/mpeg', generateBinaryData(size), {
      'Content-Disposition': 'inline; filename="test.mp3"'
    });
  }

  // GET /binary - List available endpoints
  if (path === '/binary' || path === '/v1/binary') {
    return jsonResponse(200, {
      message: 'Binary Content Test Endpoints',
      endpoints: [
        { path: '/binary/image/png', description: 'PNG image', query: 'size (KB, default 1)' },
        { path: '/binary/image/jpeg', description: 'JPEG image', query: 'size (KB, default 1)' },
        { path: '/binary/pdf', description: 'PDF document', query: 'size (KB, default 10)' },
        { path: '/binary/zip', description: 'ZIP archive', query: 'size (KB, default 1)' },
        { path: '/binary/octet-stream', description: 'Binary data', query: 'size (KB, default 10)' },
        { path: '/binary/video', description: 'Video file (MP4)', query: 'size (KB, default 100)' },
        { path: '/binary/audio', description: 'Audio file (MP3)', query: 'size (KB, default 50)' },
      ],
      usage: {
        GET: 'Returns binary content with specified Content-Type',
        POST: 'Accepts binary content and returns metadata',
      }
    });
  }

  return jsonResponse(404, {
    error: 'Not Found',
    message: 'Binary endpoint not found. Try /binary for available endpoints',
  });
};
