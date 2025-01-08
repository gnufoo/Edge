import { Logger } from '../../utils/Logger.js';
import { EventEmitter } from 'events';
import { SemanticMemory } from './SemanticMemory.js';
import { EpisodicMemory } from './EpisodicMemory.js';
import { WorkingMemory } from './WorkingMemory.js';

export class MemoryModule extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('MemoryModule');
        this.semantic = new SemanticMemory();
        this.episodic = new EpisodicMemory();
        this.working = new WorkingMemory();
        this.initialized = false;
    }

    async initialize(config = {}) {
        try {
            this.logger.info('Initializing Memory Module...');
            
            // Initialize all memory types
            await Promise.all([
                this.semantic.initialize(config.semanticMemory),
                this.episodic.initialize(config.episodicMemory),
                this.working.initialize(config.workingMemory)
            ]);

            this.initialized = true;
            this.logger.info('Memory Module initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Memory Module:', error);
            throw error;
        }
    }

    async query(params) {
        if (!this.initialized) {
            throw new Error('Memory Module not initialized');
        }

        try {
            const { type, ...queryParams } = params;
            let results;

            switch (type) {
                case 'location_query':
                    results = await this.queryLocation(queryParams);
                    break;
                case 'object_properties':
                    results = await this.semantic.queryObjectProperties(queryParams);
                    break;
                case 'past_interactions':
                    results = await this.episodic.queryPastInteractions(queryParams);
                    break;
                case 'current_context':
                    results = await this.working.getCurrentContext(queryParams);
                    break;
                default:
                    throw new Error(`Unknown query type: ${type}`);
            }

            return results;
        } catch (error) {
            this.logger.error('Error during memory query:', error);
            throw error;
        }
    }

    async queryLocation(params) {
        const { object, context } = params;
        
        try {
            // First check working memory for recent location information
            const recentLocation = await this.working.getRecentLocation(object);
            if (recentLocation) {
                return [recentLocation];
            }

            // Then check semantic memory for known typical locations
            const semanticLocations = await this.semantic.getObjectLocations(object, context);
            if (semanticLocations.length > 0) {
                return semanticLocations;
            }

            // Finally check episodic memory for past encounters
            const episodicLocations = await this.episodic.getPastLocations(object);
            return episodicLocations;
        } catch (error) {
            this.logger.error(`Error querying location for ${object}:`, error);
            throw error;
        }
    }

    async updateMemory(updateData) {
        try {
            const { type, data } = updateData;

            switch (type) {
                case 'semantic':
                    await this.semantic.update(data);
                    break;
                case 'episodic':
                    await this.episodic.addEpisode(data);
                    break;
                case 'working':
                    await this.working.update(data);
                    break;
                default:
                    throw new Error(`Unknown memory update type: ${type}`);
            }

            this.emit('memory_updated', { type, data });
        } catch (error) {
            this.logger.error('Error updating memory:', error);
            throw error;
        }
    }

    async consolidateMemory() {
        try {
            this.logger.info('Starting memory consolidation...');

            // Transfer relevant working memory to episodic memory
            const workingMemoryData = await this.working.getSignificantEvents();
            await this.episodic.addEpisodes(workingMemoryData);

            // Update semantic memory based on episodic patterns
            const patterns = await this.episodic.analyzePatterns();
            await this.semantic.updateFromPatterns(patterns);

            // Clear old working memory
            await this.working.cleanup();

            this.logger.info('Memory consolidation completed');
        } catch (error) {
            this.logger.error('Error during memory consolidation:', error);
            throw error;
        }
    }
} 