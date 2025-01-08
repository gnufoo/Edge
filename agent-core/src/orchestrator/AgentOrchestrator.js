import { Logger } from '../utils/Logger.js';
import { EventEmitter } from 'events';
import { EnvironmentState } from '../state/EnvironmentState.js';
import { DecisionEngine } from '../decision/DecisionEngine.js';

/**
 * Orchestrates the interaction between different modules of the Multi-Modal Agent
 */
export class AgentOrchestrator extends EventEmitter {
    /**
     * Creates a new AgentOrchestrator instance
     * @param {Map<string, Object>} modules - Map of initialized modules
     */
    constructor(modules) {
        super();
        this.logger = new Logger('AgentOrchestrator');
        this.modules = modules;
        this.isRunning = false;
        this.processingQueue = [];
        this.moduleStates = new Map();
        this.environmentState = new EnvironmentState();
        this.decisionEngine = new DecisionEngine(this.environmentState);
    }

    /**
     * Initializes the orchestrator and validates module connections
     */
    async initialize() {
        try {
            this.logger.info('Initializing Agent Orchestrator...');
            
            // Validate required modules
            this.validateModules();
            
            // Set up event listeners for inter-module communication
            this.setupEventListeners();
            
            // Initialize module states
            for (const [name, module] of this.modules.entries()) {
                this.moduleStates.set(name, {
                    status: 'initialized',
                    lastActivity: Date.now(),
                    errors: []
                });
            }

            this.logger.info('Agent Orchestrator initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Agent Orchestrator:', error);
            throw error;
        }
    }

    /**
     * Validates that all required modules are present and properly initialized
     * @private
     */
    validateModules() {
        const requiredModules = ['vision', 'audio', 'text', 'action'];
        
        for (const moduleName of requiredModules) {
            if (!this.modules.has(moduleName)) {
                throw new Error(`Required module "${moduleName}" is not initialized`);
            }
        }
    }

    /**
     * Sets up event listeners for inter-module communication
     * @private
     */
    setupEventListeners() {
        // Vision module events
        this.modules.get('vision').on('detection', (data) => {
            this.handleVisionDetection(data);
        });

        // Audio module events
        this.modules.get('audio').on('speech', (data) => {
            this.handleSpeechInput(data);
        });

        // Text module events
        this.modules.get('text').on('response', (data) => {
            this.handleTextResponse(data);
        });

        // Action module events
        this.modules.get('action').on('completed', (data) => {
            this.handleActionCompleted(data);
        });

        // Error handling for all modules
        for (const [name, module] of this.modules.entries()) {
            module.on('error', (error) => {
                this.handleModuleError(name, error);
            });
        }

        // Add environment state updates
        this.modules.get('vision').on('detection', (data) => {
            this.environmentState.updateVisionState(data);
        });

        this.modules.get('audio').on('speech', (data) => {
            this.environmentState.updateAudioState(data);
        });

        // Handle decision engine suggestions
        this.decisionEngine.on('actionSuggested', (action) => {
            this.handleActionSuggestion(action);
        });
    }

    /**
     * Starts the orchestrator and all modules
     */
    async start() {
        try {
            this.logger.info('Starting Agent Orchestrator...');
            this.isRunning = true;

            // Start all modules
            for (const [name, module] of this.modules.entries()) {
                await module.start();
                this.logger.info(`Started ${name} module`);
            }

            // Start the main processing loop
            this.startProcessingLoop();
            
            this.logger.info('Agent Orchestrator is running');
        } catch (error) {
            this.isRunning = false;
            this.logger.error('Failed to start Agent Orchestrator:', error);
            throw error;
        }
    }

    /**
     * Stops the orchestrator and all modules
     */
    async stop() {
        try {
            this.logger.info('Stopping Agent Orchestrator...');
            this.isRunning = false;

            // Stop all modules in reverse order
            const moduleEntries = Array.from(this.modules.entries()).reverse();
            for (const [name, module] of moduleEntries) {
                await module.stop();
                this.logger.info(`Stopped ${name} module`);
            }

            this.logger.info('Agent Orchestrator stopped');
        } catch (error) {
            this.logger.error('Error stopping Agent Orchestrator:', error);
            throw error;
        }
    }

    /**
     * Starts the main processing loop
     * @private
     */
    async startProcessingLoop() {
        while (this.isRunning) {
            try {
                if (this.processingQueue.length > 0) {
                    const task = this.processingQueue.shift();
                    await this.processTask(task);
                }
                await new Promise(resolve => setTimeout(resolve, 100)); // Prevent CPU hogging
            } catch (error) {
                this.logger.error('Error in processing loop:', error);
            }
        }
    }

    /**
     * Processes a single task
     * @private
     */
    async processTask(task) {
        try {
            this.logger.debug(`Processing task: ${task.type}`);
            
            switch (task.type) {
                case 'vision_input':
                    await this.processVisionInput(task.data);
                    break;
                case 'audio_input':
                    await this.processAudioInput(task.data);
                    break;
                case 'text_command':
                    await this.processTextCommand(task.data);
                    break;
                default:
                    this.logger.warn(`Unknown task type: ${task.type}`);
            }
        } catch (error) {
            this.logger.error(`Error processing task ${task.type}:`, error);
        }
    }

    /**
     * Handles errors from modules
     * @private
     */
    handleModuleError(moduleName, error) {
        const state = this.moduleStates.get(moduleName);
        state.errors.push({
            timestamp: Date.now(),
            error: error
        });
        
        this.logger.error(`Error in ${moduleName} module:`, error);
        
        // Emit error event for external handling
        this.emit('module_error', { module: moduleName, error });
    }

    // Event handlers for different module events
    async handleVisionDetection(data) {
        this.processingQueue.push({ type: 'vision_input', data });
    }

    async handleSpeechInput(data) {
        this.processingQueue.push({ type: 'audio_input', data });
    }

    async handleTextResponse(data) {
        await this.modules.get('action').executeAction(data);
    }

    async handleActionCompleted(data) {
        this.emit('action_completed', data);
    }
}
