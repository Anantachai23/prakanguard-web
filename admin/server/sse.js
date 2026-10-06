/**
 * PrakanGuard Admin Command Center - Real-Time Server-Sent Events (SSE)
 */
const sseClients = new Set();

/**
 * Broadcast event to all open Admin tabs via SSE
 * @param {string} type 
 * @param {any} payload 
 */
function broadcastSSE(type, payload) {
  const data = JSON.stringify({ type, data: payload, timestamp: Date.now() });
  const msg = `event: ${type}\ndata: ${data}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function addClient(res) {
  sseClients.add(res);
}

function removeClient(res) {
  sseClients.delete(res);
}

module.exports = {
  broadcastSSE,
  addClient,
  removeClient,
  sseClients
};
