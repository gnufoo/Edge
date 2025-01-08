import { Logger } from '../../utils/Logger.js';

export class EpisodicMemory {
    constructor() {
        this.logger = new Logger('EpisodicMemory');
        this.episodes = [];
        this.maxEpisodes = 1000;
    }

    async initialize(config = {}) {
        try {
            this.maxEpisodes = config.maxEpisodes || 1000;
            if (config.preloadedEpisodes) {
                this.episodes = config.preloadedEpisodes;
            }
        } catch (error) {
            this.logger.error('Error initializing episodic memory:', error);
            throw error;
        }
    }

    async addEpisode(episode) {
        try {
            episode.timestamp = Date.now();
            this.episodes.push(episode);

            if (this.episodes.length > this.maxEpisodes) {
                this.episodes.shift();
            }
        } catch (error) {
            this.logger.error('Error adding episode:', error);
            throw error;
        }
    }

    async getPastLocations(object) {
        try {
            const relevantEpisodes = this.episodes.filter(episode => 
                episode.objects && episode.objects.includes(object)
            );

            return relevantEpisodes.map(episode => ({
                location: episode.location,
                timestamp: episode.timestamp,
                confidence: this.calculateConfidence(episode)
            }));
        } catch (error) {
            this.logger.error(`Error getting past locations for ${object}:`, error);
            throw error;
        }
    }

    async queryPastInteractions(params) {
        const { object, timeRange, limit } = params;
        try {
            let relevantEpisodes = this.episodes.filter(episode => {
                if (!episode.objects?.includes(object)) return false;
                if (timeRange) {
                    return episode.timestamp >= timeRange.start && 
                           episode.timestamp <= timeRange.end;
                }
                return true;
            });

            if (limit) {
                relevantEpisodes = relevantEpisodes.slice(-limit);
            }

            return relevantEpisodes;
        } catch (error) {
            this.logger.error('Error querying past interactions:', error);
            throw error;
        }
    }

    async analyzePatterns() {
        try {
            const patterns = [];
            const objectOccurrences = new Map();

            // Analyze object locations and behaviors
            for (const episode of this.episodes) {
                if (episode.objects) {
                    for (const object of episode.objects) {
                        if (!objectOccurrences.has(object)) {
                            objectOccurrences.set(object, []);
                        }
                        objectOccurrences.get(object).push(episode);
                    }
                }
            }

            // Extract patterns from occurrences
            for (const [object, episodes] of objectOccurrences) {
                if (episodes.length >= 3) { // Minimum episodes for pattern recognition
                    const locationPattern = this.extractLocationPattern(object, episodes);
                    if (locationPattern) {
                        patterns.push(locationPattern);
                    }
                }
            }

            return patterns;
        } catch (error) {
            this.logger.error('Error analyzing patterns:', error);
            throw error;
        }
    }

    private calculateConfidence(episode) {
        const age = Date.now() - episode.timestamp;
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        return Math.max(0.1, 1 - (age / maxAge));
    }

    private extractLocationPattern(object, episodes) {
        // Implement pattern recognition logic
        // Return null if no significant pattern is found
        return null;
    }
} 