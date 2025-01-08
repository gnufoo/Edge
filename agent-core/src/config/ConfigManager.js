import fs from 'fs';
import path from 'path';
import { Logger } from '../utils/Logger.js';

/**
 * Manages configuration for the Multi-Modal Agent system and its modules
 */
export class ConfigManager {
    constructor() {
        this.logger = new Logger('ConfigManager');
        this.config = {
            global: {},
            modules: {}
        };
        this.configPath = process.env.CONFIG_PATH || 'config';
        this.initialized = false;
    }

    /**
     * Initializes the configuration manager
     */
    async initialize() {
        try {
            this.logger.info('Initializing configuration manager...');
            
            // Load global configuration
            await this.loadGlobalConfig();
            
            // Load module-specific configurations
            await this.loadModuleConfigs();
            
            // Validate configurations
            this.validateConfigs();
            
            this.initialized = true;
            this.logger.info('Configuration manager initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize configuration manager:', error);
            throw error;
        }
    }

    /**
     * Loads the global configuration file
     * @private
     */
    async loadGlobalConfig() {
        try {
            const globalConfigPath = path.join(this.configPath, 'global.json');
            const configData = await fs.promises.readFile(globalConfigPath, 'utf8');
            this.config.global = JSON.parse(configData);
            
            // Apply environment variable overrides
            this.applyEnvironmentOverrides(this.config.global);
            
            this.logger.debug('Loaded global configuration');
        } catch (error) {
            this.logger.error('Error loading global configuration:', error);
            throw error;
        }
    }

    /**
     * Loads configurations for all modules
     * @private
     */
    async loadModuleConfigs() {
        try {
            const moduleConfigPath = path.join(this.configPath, 'modules');
            const modules = ['vision', 'audio', 'text', 'action'];

            for (const module of modules) {
                const configFile = path.join(moduleConfigPath, `${module}.json`);
                
                if (fs.existsSync(configFile)) {
                    const configData = await fs.promises.readFile(configFile, 'utf8');
                    this.config.modules[module] = JSON.parse(configData);
                    
                    // Apply environment variable overrides for module
                    this.applyEnvironmentOverrides(
                        this.config.modules[module], 
                        `MODULE_${module.toUpperCase()}_`
                    );
                    
                    this.logger.debug(`Loaded configuration for ${module} module`);
                } else {
                    this.logger.warn(`No configuration file found for ${module} module`);
                    this.config.modules[module] = {};
                }
            }
        } catch (error) {
            this.logger.error('Error loading module configurations:', error);
            throw error;
        }
    }

    /**
     * Applies environment variable overrides to configuration
     * @private
     */
    applyEnvironmentOverrides(config, prefix = '') {
        for (const [key, value] of Object.entries(config)) {
            const envKey = `${prefix}${key.toUpperCase()}`;
            
            if (typeof value === 'object' && value !== null) {
                this.applyEnvironmentOverrides(value, `${envKey}_`);
            } else {
                const envValue = process.env[envKey];
                if (envValue !== undefined) {
                    config[key] = this.parseEnvValue(envValue, typeof value);
                }
            }
        }
    }

    /**
     * Parses environment variable values to their proper type
     * @private
     */
    parseEnvValue(value, targetType) {
        switch (targetType) {
            case 'number':
                return Number(value);
            case 'boolean':
                return value.toLowerCase() === 'true';
            case 'object':
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            default:
                return value;
        }
    }

    /**
     * Validates the loaded configurations
     * @private
     */
    validateConfigs() {
        // Validate global config
        this.validateGlobalConfig();

        // Validate module configs
        for (const [module, config] of Object.entries(this.config.modules)) {
            this.validateModuleConfig(module, config);
        }
    }

    /**
     * Validates the global configuration
     * @private
     */
    validateGlobalConfig() {
        const required = ['agentName', 'version', 'logLevel'];
        
        for (const field of required) {
            if (!this.config.global[field]) {
                throw new Error(`Missing required global configuration field: ${field}`);
            }
        }
    }

    /**
     * Validates a module's configuration
     * @private
     */
    validateModuleConfig(moduleName, config) {
        // Add module-specific validation logic here
        switch (moduleName) {
            case 'vision':
                this.validateVisionConfig(config);
                break;
            case 'audio':
                this.validateAudioConfig(config);
                break;
            case 'text':
                this.validateTextConfig(config);
                break;
            case 'action':
                this.validateActionConfig(config);
                break;
        }
    }

    /**
     * Gets the global configuration
     */
    getGlobalConfig() {
        return this.config.global;
    }

    /**
     * Gets configurations for all modules
     */
    getModuleConfigs() {
        return this.config.modules;
    }

    /**
     * Gets configuration for a specific module
     * @param {string} moduleName - Name of the module
     */
    getModuleConfig(moduleName) {
        return this.config.modules[moduleName];
    }

    /**
     * Updates a module's configuration
     * @param {string} moduleName - Name of the module
     * @param {Object} config - New configuration
     */
    async updateModuleConfig(moduleName, config) {
        try {
            this.validateModuleConfig(moduleName, config);
            this.config.modules[moduleName] = config;
            
            // Save to file
            const configFile = path.join(
                this.configPath, 
                'modules', 
                `${moduleName}.json`
            );
            
            await fs.promises.writeFile(
                configFile,
                JSON.stringify(config, null, 2)
            );
            
            this.logger.info(`Updated configuration for ${moduleName} module`);
        } catch (error) {
            this.logger.error(`Error updating ${moduleName} configuration:`, error);
            throw error;
        }
    }

    // Module-specific configuration validators
    validateVisionConfig(config) {
        const required = ['modelPath', 'threshold', 'inputSize'];
        this.validateRequiredFields(config, required, 'vision');
    }

    validateAudioConfig(config) {
        const required = ['sampleRate', 'channels', 'encoding'];
        this.validateRequiredFields(config, required, 'audio');
    }

    validateTextConfig(config) {
        const required = ['model', 'maxTokens', 'temperature'];
        this.validateRequiredFields(config, required, 'text');
    }

    validateActionConfig(config) {
        const required = ['maxActions', 'timeout'];
        this.validateRequiredFields(config, required, 'action');
    }

    /**
     * Validates required fields in a configuration
     * @private
     */
    validateRequiredFields(config, required, moduleName) {
        for (const field of required) {
            if (!config[field]) {
                throw new Error(
                    `Missing required field '${field}' in ${moduleName} configuration`
                );
            }
        }
    }
}
