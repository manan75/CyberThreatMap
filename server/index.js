const http = require('http');
const { Server } = require("socket.io");

const { loadConfig } = require('./config');
const { createApp } = require('./app');
const { fetchThreats } = require('./services/collector');
const { enrichThreatData } = require('./services/locator');

const config = loadConfig();
config.warnings.forEach(warning => console.warn(`⚠️  ${warning}`));

// Exposed through GET /health so we can see whether polling is working.
const pollStatus = { lastPollAt: null, lastThreatCount: 0 };

const app = createApp({ config, getStatus: () => pollStatus });

const server = http.createServer(app);
const io = new Server(server, {
    cors: config.cors
});

// Since we don't know the real victim, we visualize attacks hitting *us* --> honeypots 
// in these locations.
const TARGETS = [
    { name: "HQ (Seattle)", lat: 47.6062, lng: -122.3321 },
    { name: "Server EU (Berlin)", lat: 52.5200, lng: 13.4050 },
    { name: "Server Asia (Tokyo)", lat: 35.6762, lng: 139.6503 },
    { name: "Server SA (Sao Paulo)", lat: -23.5505, lng: -46.6333 },
    { name: "Server AU (Sydney)", lat: -33.8688, lng: 151.2093 },
    { name: "Server IN (Mumbai)", lat: 19.0760, lng: 72.8777 },
    { name: "Server IN (Delhi)", lat: 28.7041, lng: 77.1025 },
    { name: "Server IN (Bangalore)", lat: 12.9716, lng: 77.5946 }
];

function getRandomTarget() {
    return TARGETS[Math.floor(Math.random() * TARGETS.length)];
}

async function broadcastThreats() {
    try {
        console.log("Cycle Start: Fetching new intelligence...");
        
        
        const rawData = await fetchThreats();

        let richData = enrichThreatData(rawData);
        pollStatus.lastPollAt = new Date().toISOString();
        pollStatus.lastThreatCount = richData.length;

   
        richData = richData.map(attack => {
            const target = getRandomTarget();
            return {
                ...attack,
                dst: {
                    name: target.name,
                    lat: target.lat,
                    lng: target.lng
                }
            };
        });

     
        if (richData.length > 0) {
            console.log(`📡 Broadcasting ${richData.length} attacks to clients.`);
            io.emit('threat-data', richData);
        }

    } catch (error) {
        console.error("Critical Error in Loop:", error);
    }
}


io.on('connection', (socket) => {
    console.log('👤 New Client Connected:', socket.id); 
    
  
});

setInterval(broadcastThreats, 60000);

broadcastThreats();



const PORT = config.port;

server.listen(PORT, () => {
    console.log(`
        Backend is alive! (${config.nodeEnv})
        Server running on: http://localhost:${PORT}
        Health check: http://localhost:${PORT}/health
        Socket Endpoint: ws://localhost:${PORT}`);
});
