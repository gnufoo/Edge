import { Logger } from '../../utils/Logger.js';

export class SemanticMemory {
    constructor() {
        this.logger = new Logger('SemanticMemory');
        this.knowledgeBase = new Map();
        this.relationships = new Map();
    }

    async initialize(config = {}) {
        try {
            if (config.locations) {
                this.knowledgeBase.set('locations', new Map(Object.entries(config.locations)));
            }
            
            if (config.objectProperties) {
                this.knowledgeBase.set('properties', new Map(Object.entries(config.objectProperties)));
            }

            if (config.relationships) {
                this.relationships = new Map(Object.entries(config.relationships));
            }
        } catch (error) {
            this.logger.error('Error initializing semantic memory:', error);
            throw error;
        }
    }

    async getObjectLocations(object, context) {
        try {
            const locations = this.knowledgeBase.get('locations');
            if (!locations) return [];

            // Check context-specific locations
            if (context && locations.has(`${object}_${context}`)) {
                return locations.get(`${object}_${context}`);
            }

            // Check general locations
            if (locations.has(object)) {
                return locations.get(object);
            }

            return [];
        } catch (error) {
            this.logger.error(`Error getting locations for ${object}:`, error);
            throw error;
        }
    }

    async queryObjectProperties(params) {
        const { object, propertyType } = params;
        try {
            const properties = this.knowledgeBase.get('properties');
            if (!properties || !properties.has(object)) return null;

            const objectProps = properties.get(object);
            return propertyType ? objectProps[propertyType] : objectProps;
        } catch (error) {
            this.logger.error(`Error querying properties for ${object}:`, error);
            throw error;
        }
    }

    async updateFromPatterns(patterns) {
        try {
            for (const pattern of patterns) {
                const { object, property, value, confidence } = pattern;
                
                if (confidence > 0.7) { // Threshold for updating semantic memory
                    const properties = this.knowledgeBase.get('properties') || new Map();
                    const objectProps = properties.get(object) || {};
                    
                    objectProps[property] = value;
                    properties.set(object, objectProps);
                    this.knowledgeBase.set('properties', properties);
                }
            }
        } catch (error) {
            this.logger.error('Error updating semantic memory from patterns:', error);
            throw error;
        }
    }
} 