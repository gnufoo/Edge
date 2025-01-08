import dotenv from 'dotenv';
import { AgentOrchestrator } from './orchestrator/AgentOrchestrator.js';
import { ConfigManager } from './config/ConfigManager.js';
import { Logger } from './utils/Logger.js';
import { 
    VisionModule,
    AudioModule,
    TextModule,
    ActionModule 
} from './modules/index.js';

// Initialize environment variables
dotenv.config();

class MultiModalAgent {
    constructor() {
        this.logger = new Logger('MultiModalAgent');
        this.config = new ConfigManager();
        this.modules = new Map();
        this.orchestrator = null;
    }

    async initialize() {
        try {
            this.logger.info('Initializing Multi-Modal Agent...');
            
            // Initialize core modules
            await this.initializeModules();
            
            // Initialize orchestrator with modules
            this.orchestrator = new AgentOrchestrator(this.modules);
            await this.orchestrator.initialize();

            this.logger.info('Multi-Modal Agent initialization completed successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Multi-Modal Agent:', error);
            throw error;
        }
    }

    async initializeModules() {
        try {
            // Initialize and register all modules
            const moduleConfigs = this.config.getModuleConfigs();

            const modules = {
                vision: new VisionModule(moduleConfigs.vision),
                audio: new AudioModule(moduleConfigs.audio),
                text: new TextModule(moduleConfigs.text),
                action: new ActionModule(moduleConfigs.action)
            };

            // Initialize each module and add to modules map
            for (const [name, module] of Object.entries(modules)) {
                await module.initialize();
                this.modules.set(name, module);
                this.logger.info(`${name} module initialized successfully`);
            }
        } catch (error) {
            this.logger.error('Failed to initialize modules:', error);
            throw error;
        }
    }

    async start() {
        try {
            this.logger.info('Starting Multi-Modal Agent...');
            await this.orchestrator.start();
            this.logger.info('Multi-Modal Agent is now running');
        } catch (error) {
            this.logger.error('Failed to start Multi-Modal Agent:', error);
            throw error;
        }
    }

    async stop() {
        try {
            this.logger.info('Stopping Multi-Modal Agent...');
            await this.orchestrator.stop();
            
            // Cleanup modules
            for (const [name, module] of this.modules.entries()) {
                await module.cleanup();
                this.logger.info(`${name} module cleaned up successfully`);
            }
            
            this.logger.info('Multi-Modal Agent stopped successfully');
        } catch (error) {
            this.logger.error('Error during Multi-Modal Agent shutdown:', error);
            throw error;
        }
    }
}

// Main execution
async function main() {
    const agent = new MultiModalAgent();
    
    // Handle process termination
    process.on('SIGINT', async () => {
        console.log('\nReceived SIGINT. Gracefully shutting down...');
        await agent.stop();
        process.exit(0);
    });

    process.on('uncaughtException', async (error) => {
        console.error('Uncaught Exception:', error);
        await agent.stop();
        process.exit(1);
    });

    try {
        await agent.initialize();
        await agent.start();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run the agent
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error in main:', error);
        process.exit(1);
    });
}

export default MultiModalAgent;
