import { Logger } from '../../utils/Logger.js';

export class WorkingMemory {
    constructor() {
        this.logger = new Logger('WorkingMemory');
        this.currentContext = new Map();
        this.recentEvents = [];
        this.maxEvents = 50;
    }

    async initialize(config = {}) {
        try {
            this.maxEvents = config.maxEvents || 50;
            if (config.initialContext) {
                this.currentContext = new Map(Object.entries(config.initialContext));
            }
        } catch (error) {
            this.logger.error('Error initializing working memory:', error);
            throw error;
        }
    }

    async update(data) {
        try {
            const { context, event } = data;

            if (context) {
                for (const [key, value] of Object.entries(context)) {
                    this.currentContext.set(key, value);
                }
            }

            if (event) {
                this.recentEvents.push({
                    ...event,
                    timestamp: Date.now()
                });

                if (this.recentEvents.length > this.maxEvents) {
                    this.recentEvents.shift();
                }
            }
        } catch (error) {
            this.logger.error('Error updating working memory:', error);
            throw error;
        }
    }

    async getRecentLocation(object) {
        try {
            const recentEvent = [...this.recentEvents]
                .reverse()
                .find(event => 
                    event.type === 'location_update' && 
                    event.object === object
                );

            return recentEvent ? recentEvent.location : null;
        } catch (error) {
            this.logger.error(`Error getting recent location for ${object}:`, error);
            throw error;
        }
    }

    async getCurrentContext(params = {}) {
        try {
            if (params.key) {
                return this.currentContext.get(params.key);
            }
            return Object.fromEntries(this.currentContext);
        } catch (error) {
            this.logger.error('Error getting current context:', error);
            throw error;
        }
    }

    async getSignificantEvents() {
        try {
            return this.recentEvents.filter(event => 
                event.significance && event.significance > 0.5
            );
        } catch (error) {
            this.logger.error('Error getting significant events:', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            const retentionTime = 5 * 60 * 1000; // 5 minutes
            const now = Date.now();
            
            this.recentEvents = this.recentEvents.filter(event => 
                now - event.timestamp < retentionTime
            );
        } catch (error) {
            this.logger.error('Error cleaning up working memory:', error);
            throw error;
        }
    }
} 