import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Logger } from '../src/utils/Logger.js';

const logger = new Logger('Development');

async function startDevelopment() {
    try {
        logger.info('Starting development environment...');

        // Setup watchers
        setupFileWatchers();

        // Start development server
        await startDevServer();

        // Initialize development tools
        await initializeDevTools();

        logger.info('Development environment started successfully');
    } catch (error) {
        logger.error('Error starting development environment:', error);
        process.exit(1);
    }
}

function setupFileWatchers() {
    // Watch source files
    fs.watch('src', { recursive: true }, (eventType, filename) => {
        logger.debug(`File changed: ${filename}`);
        handleFileChange(filename);
    });

    // Watch configuration files
    fs.watch('config', { recursive: true }, (eventType, filename) => {
        logger.debug(`Config changed: ${filename}`);
        handleConfigChange(filename);
    });
}

async function startDevServer() {
    try {
        logger.info('Starting development server...');
        execSync('npm run dev:server', { stdio: 'inherit' });
    } catch (error) {
        logger.error('Error starting development server:', error);
        throw error;
    }
}

async function initializeDevTools() {
    try {
        // Initialize debugger
        setupDebugger();

        // Start monitoring
        startMonitoring();

        // Initialize hot reload
        setupHotReload();
    } catch (error) {
        logger.error('Error initializing development tools:', error);
        throw error;
    }
}

startDevelopment().catch(error => {
    logger.error('Development startup failed:', error);
    process.exit(1);
}); 