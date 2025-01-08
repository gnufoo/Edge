import { Logger } from '../utils/Logger.js';
import EventEmitter from 'events';

/**
 * Manages a unified representation of the environment state from multi-modal inputs
 */
export class EnvironmentState extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('EnvironmentState');
        this.state = {
            timestamp: Date.now(),
            vision: {
                detectedObjects: [],
                faces: [],
                poses: [],
                sceneDescription: null,
                attention: { x: 0, y: 0, confidence: 0 }
            },
            audio: {
                isListening: false,
                lastTranscript: null,
                ambientNoise: 0,
                speakers: [],
                activeSource: null
            },
            interaction: {
                activeConversation: false,
                lastUserInput: null,
                userAttentive: false,
                turnContext: null
            },
            physical: {
                agentPosition: { x: 0, y: 0, z: 0 },
                nearbyObjects: [],
                environmentType: null,
                lighting: null
            },
            memory: {
                shortTerm: new Map(),
                relevantContext: [],
                activeGoals: []
            }
        };
        
        this.stateHistory = [];
        this.maxHistoryLength = 100;
    }

    /**
     * Updates vision-related state information
     */
    updateVisionState(visionData) {
        try {
            const timestamp = Date.now();
            const previousState = { ...this.state.vision };

            // Update vision state
            this.state.vision = {
                ...this.state.vision,
                ...visionData,
                lastUpdate: timestamp
            };

            // Analyze changes
            const changes = this.analyzeStateChanges('vision', previousState, this.state.vision);
            if (changes.significant) {
                this.emit('significantChange', {
                    modality: 'vision',
                    changes: changes.details
                });
            }

            this.addToHistory('vision', timestamp);
        } catch (error) {
            this.logger.error('Error updating vision state:', error);
        }
    }

    /**
     * Updates audio-related state information
     */
    updateAudioState(audioData) {
        try {
            const timestamp = Date.now();
            const previousState = { ...this.state.audio };

            // Update audio state
            this.state.audio = {
                ...this.state.audio,
                ...audioData,
                lastUpdate: timestamp
            };

            // Process speech events specifically
            if (audioData.transcript) {
                this.processTranscript(audioData.transcript, timestamp);
            }

            const changes = this.analyzeStateChanges('audio', previousState, this.state.audio);
            if (changes.significant) {
                this.emit('significantChange', {
                    modality: 'audio',
                    changes: changes.details
                });
            }

            this.addToHistory('audio', timestamp);
        } catch (error) {
            this.logger.error('Error updating audio state:', error);
        }
    }

    /**
     * Updates interaction-related state
     */
    updateInteractionState(interactionData) {
        try {
            const timestamp = Date.now();
            const previousState = { ...this.state.interaction };

            this.state.interaction = {
                ...this.state.interaction,
                ...interactionData,
                lastUpdate: timestamp
            };

            // Update relevant context based on interaction
            this.updateRelevantContext(interactionData);

            const changes = this.analyzeStateChanges('interaction', previousState, this.state.interaction);
            if (changes.significant) {
                this.emit('significantChange', {
                    modality: 'interaction',
                    changes: changes.details
                });
            }

            this.addToHistory('interaction', timestamp);
        } catch (error) {
            this.logger.error('Error updating interaction state:', error);
        }
    }

    /**
     * Analyzes changes between previous and current state
     * @private
     */
    analyzeStateChanges(modality, previousState, currentState) {
        const changes = {
            significant: false,
            details: {}
        };

        // Define significance thresholds for different modalities
        const thresholds = {
            vision: {
                objectCountDiff: 2,
                positionChange: 0.5
            },
            audio: {
                volumeChange: 10,
                speakerChange: true
            },
            interaction: {
                contextChange: true,
                attentionChange: true
            }
        };

        // Compare states based on modality
        switch (modality) {
            case 'vision':
                changes.significant = this.analyzeVisionChanges(
                    previousState, 
                    currentState, 
                    thresholds.vision,
                    changes.details
                );
                break;
            case 'audio':
                changes.significant = this.analyzeAudioChanges(
                    previousState, 
                    currentState, 
                    thresholds.audio,
                    changes.details
                );
                break;
            case 'interaction':
                changes.significant = this.analyzeInteractionChanges(
                    previousState, 
                    currentState, 
                    thresholds.interaction,
                    changes.details
                );
                break;
        }

        return changes;
    }

    /**
     * Updates the relevant context based on current state
     * @private
     */
    updateRelevantContext(newData) {
        const context = [];

        // Add visual context
        if (this.state.vision.detectedObjects.length > 0) {
            context.push({
                type: 'visual',
                objects: this.state.vision.detectedObjects,
                confidence: this.calculateContextConfidence('vision')
            });
        }

        // Add audio context
        if (this.state.audio.lastTranscript) {
            context.push({
                type: 'audio',
                transcript: this.state.audio.lastTranscript,
                confidence: this.calculateContextConfidence('audio')
            });
        }

        // Add interaction context
        if (this.state.interaction.turnContext) {
            context.push({
                type: 'interaction',
                context: this.state.interaction.turnContext,
                confidence: this.calculateContextConfidence('interaction')
            });
        }

        this.state.memory.relevantContext = context;
    }

    /**
     * Calculates confidence score for different modalities
     * @private
     */
    calculateContextConfidence(modality) {
        switch (modality) {
            case 'vision':
                return this.calculateVisionConfidence();
            case 'audio':
                return this.calculateAudioConfidence();
            case 'interaction':
                return this.calculateInteractionConfidence();
            default:
                return 0.5;
        }
    }

    /**
     * Gets the current unified state representation
     */
    getCurrentState() {
        return {
            ...this.state,
            timestamp: Date.now()
        };
    }

    /**
     * Gets relevant context for decision making
     */
    getRelevantContext() {
        return {
            immediate: this.state.memory.relevantContext,
            shortTerm: Array.from(this.state.memory.shortTerm.entries()),
            goals: this.state.memory.activeGoals
        };
    }

    /**
     * Adds current state to history
     * @private
     */
    addToHistory(modality, timestamp) {
        this.stateHistory.push({
            timestamp,
            modality,
            state: JSON.parse(JSON.stringify(this.state))
        });

        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    }

    /**
     * Gets state history for a specific time range
     */
    getStateHistory(startTime, endTime) {
        return this.stateHistory.filter(entry => 
            entry.timestamp >= startTime && entry.timestamp <= endTime
        );
    }
} 