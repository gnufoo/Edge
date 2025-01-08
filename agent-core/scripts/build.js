import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Logger } from '../src/utils/Logger.js';

const logger = new Logger('Build');

async function buildProject() {
    try {
        logger.info('Starting build process...');

        // Clean previous build
        await cleanBuild();

        // Run tests
        await runTests();

        // Build source
        await buildSource();

        // Generate documentation
        await generateDocs();

        logger.info('Build completed successfully');
    } catch (error) {
        logger.error('Build failed:', error);
        process.exit(1);
    }
}

async function cleanBuild() {
    const dirsToClean = ['dist', 'docs'];
    
    for (const dir of dirsToClean) {
        const dirPath = path.join(process.cwd(), dir);
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true });
            logger.info(`Cleaned ${dir} directory`);
        }
    }
}

async function runTests() {
    try {
        logger.info('Running tests...');
        execSync('npm test', { stdio: 'inherit' });
    } catch (error) {
        logger.error('Tests failed:', error);
        throw error;
    }
}

async function buildSource() {
    try {
        logger.info('Building source...');
        execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
        logger.error('Source build failed:', error);
        throw error;
    }
}

async function generateDocs() {
    try {
        logger.info('Generating documentation...');
        execSync('npm run docs', { stdio: 'inherit' });
    } catch (error) {
        logger.error('Documentation generation failed:', error);
        throw error;
    }
}

buildProject().catch(error => {
    logger.error('Build process failed:', error);
    process.exit(1);
}); 