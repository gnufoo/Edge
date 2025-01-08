import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Logger } from '../src/utils/Logger.js';

const logger = new Logger('Setup');

async function setupEnvironment() {
    try {
        logger.info('Starting environment setup...');

        // Create necessary directories
        createDirectories();

        // Install dependencies
        await installDependencies();

        // Initialize configurations
        await initializeConfigs();

        // Setup development environment
        await setupDevelopmentEnv();

        logger.info('Environment setup completed successfully');
    } catch (error) {
        logger.error('Error during environment setup:', error);
        process.exit(1);
    }
}

function createDirectories() {
    const dirs = [
        'config',
        'config/modules',
        'logs',
        'models',
        'data/cache',
        'data/temp'
    ];

    dirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            logger.info(`Created directory: ${dir}`);
        }
    });
}

async function installDependencies() {
    try {
        logger.info('Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
        logger.error('Error installing dependencies:', error);
        throw error;
    }
}

async function initializeConfigs() {
    const configTemplates = [
        'global',
        'modules/vision',
        'modules/audio',
        'modules/text',
        'modules/action'
    ];

    for (const template of configTemplates) {
        const configPath = path.join(process.cwd(), 'config', `${template}.json`);
        if (!fs.existsSync(configPath)) {
            const templatePath = path.join(process.cwd(), 'scripts/templates', `${template}.template.json`);
            fs.copyFileSync(templatePath, configPath);
            logger.info(`Initialized config: ${template}`);
        }
    }
}

async function setupDevelopmentEnv() {
    // Setup environment variables
    if (!fs.existsSync('.env')) {
        fs.copyFileSync('scripts/templates/.env.template', '.env');
        logger.info('Created .env file from template');
    }

    // Setup git hooks
    setupGitHooks();
}

setupEnvironment().catch(error => {
    logger.error('Setup failed:', error);
    process.exit(1);
}); 