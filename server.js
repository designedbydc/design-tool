import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the root directory
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));

// Handle 404s for JS files by checking core directory
app.use((req, res, next) => {
    if (req.path.endsWith('.js') && req.path.startsWith('/js/')) {
        const corePath = path.join(__dirname, 'js/core', path.basename(req.path));
        if (fs.existsSync(corePath)) {
            res.type('application/javascript; charset=utf-8');
            res.sendFile(corePath);
            return;
        }
    }
    next();
});

const PORT = process.env.PORT || 3003;

// Function to start the server with error handling
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
};

// Start the server
startServer(PORT); 