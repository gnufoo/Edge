import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Logger } from '../src/utils/Logger.js';

const logger = new Logger('Deploy');

async function deployProject(environment = 'development') {
    try {
        logger.info(`Starting deployment to ${environment}...`);

        // Validate environment
        validateEnvironment(environment);

        // Load deployment config
        const config = loadDeploymentConfig(environment);

        // Run pre-deployment checks
        await runPreDeploymentChecks(config);

        // Deploy
        await deploy(config);

        // Run post-deployment tasks
        await runPostDeploymentTasks(config);

        logger.info(`Deployment to ${environment} completed successfully`);
    } catch (error) {
        logger.error(`Deployment to ${environment} failed:`, error);
        process.exit(1);
    }
}

function validateEnvironment(environment) {
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
        throw new Error(`Invalid environment: ${environment}`);
    }
}

function loadDeploymentConfig(environment) {
    const configPath = path.join(process.cwd(), 'scripts/config', `deploy.${environment}.json`);
    if (!fs.existsSync(configPath)) {
        throw new Error(`Deployment config not found for environment: ${environment}`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

async function runPreDeploymentChecks(config) {
    logger.info('Running pre-deployment checks...');

    // Check dependencies
    await checkDependencies();

    // Validate configurations
    await validateConfigurations(config);

    // Check system requirements
    await checkSystemRequirements(config);
}

async function deploy(config) {
    logger.info('Executing deployment...');

    // Backup current version if needed
    if (config.backup) {
        await createBackup();
    }

    // Deploy new version
    await deployNewVersion(config);

    // Update configurations
    await updateConfigurations(config);
}

async function runPostDeploymentTasks(config) {
    logger.info('Running post-deployment tasks...');

    // Run database migrations if needed
    if (config.runMigrations) {
        await runMigrations();
    }

    // Clear caches
    await clearCaches();

    // Run health checks
    await runHealthChecks();
}

deployProject(process.argv[2]).catch(error => {
    logger.error('Deployment failed:', error);
    process.exit(1);
}); 