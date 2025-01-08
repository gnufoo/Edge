import { Logger } from '../utils/Logger.js';

export class DecisionEngine {
    constructor(environmentState) {
        this.logger = new Logger('DecisionEngine');
        this.environmentState = environmentState;
        this.decisionStrategies = new Map();
        
        // Listen for significant environment changes
        this.environmentState.on('significantChange', this.onEnvironmentChange.bind(this));
    }

    /**
     * Evaluates the current state and makes decisions
     */
    async evaluateState() {
        try {
            const currentState = this.environmentState.getCurrentState();
            const context = this.environmentState.getRelevantContext();
            
            // Prioritize different aspects of the environment
            const priorities = this.prioritizeInputs(currentState, context);
            
            // Generate potential actions
            const actions = await this.generatePotentialActions(priorities);
            
            // Select best action based on current context
            const selectedAction = this.selectBestAction(actions, context);
            
            return selectedAction;
        } catch (error) {
            this.logger.error('Error in state evaluation:', error);
            throw error;
        }
    }

    /**
     * Prioritizes different inputs based on current context
     * @private
     */
    prioritizeInputs(state, context) {
        const priorities = {
            vision: this.calculateVisionPriority(state.vision),
            audio: this.calculateAudioPriority(state.audio),
            interaction: this.calculateInteractionPriority(state.interaction),
            context: this.calculateContextPriority(context)
        };

        return this.normalizePriorities(priorities);
    }

    /**
     * Generates potential actions based on current state
     * @private
     */
    async generatePotentialActions(priorities) {
        const actions = [];
        
        // Generate actions based on high-priority inputs
        for (const [modality, priority] of Object.entries(priorities)) {
            if (priority > 0.5) {
                const modalityActions = await this.generateModalityActions(modality);
                actions.push(...modalityActions);
            }
        }

        return actions;
    }

    /**
     * Selects the best action based on current context
     * @private
     */
    selectBestAction(actions, context) {
        let bestAction = null;
        let highestScore = -1;

        for (const action of actions) {
            const score = this.evaluateActionFitness(action, context);
            if (score > highestScore) {
                highestScore = score;
                bestAction = action;
            }
        }

        return bestAction;
    }

    /**
     * Handles significant changes in the environment
     * @private
     */
    onEnvironmentChange(change) {
        this.logger.info(`Significant environment change detected in ${change.modality}`);
        this.evaluateState().then(action => {
            if (action) {
                this.logger.info(`Suggested action based on environment change:`, action);
                // Emit action suggestion event
                this.emit('actionSuggested', action);
            }
        });
    }
} 