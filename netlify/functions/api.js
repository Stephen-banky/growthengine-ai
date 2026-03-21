const serverless = require('serverless-http');

// Need to wait for sql.js DB initialization before handling requests
let handler;
let dbReady = false;

async function initHandler() {
  if (handler) return handler;

  // Initialize the database first
  const db = require('../../config/database');
  if (db.ready) {
    await db.ready();
  }
  dbReady = true;

  // Now load the Express app (routes will use initialized db)
  const { app } = require('../../server/app');
  handler = serverless(app);
  return handler;
}

exports.handler = async (event, context) => {
  const h = await initHandler();
  return h(event, context);
};
