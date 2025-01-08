import { MultiModalAgent } from '../../main.js';
import { EnvironmentState } from '../../state/EnvironmentState.js';
import { DecisionEngine } from '../../decision/DecisionEngine.js';
import { MemoryModule } from '../../modules/memory/MemoryModule.js';
import { SkillPool } from '../../modules/skills/SkillPool.js';
import { Logger } from '../../utils/Logger.js';

describe('Beer Fetch Scenario', () => {
    let agent;
    let environmentState;
    let memoryModule;
    let skillPool;
    let logger;

    beforeEach(() => {
        logger = new Logger('TestScenario');
        environmentState = new EnvironmentState();
        memoryModule = new MemoryModule();
        skillPool = new SkillPool();
        
        // Initialize with test data
        setupTestEnvironment();
    });

    async function setupTestEnvironment() {
        // Setup initial environment state
        await environmentState.updatePhysicalState({
            agentPosition: { x: 0, y: 0, z: 0 },
            environmentType: 'indoor_home',
            knownObjects: [
                { type: 'refrigerator', position: { x: 5, y: 0, z: -3 }, state: 'closed' },
                { type: 'human', id: 'commander', position: { x: 1, y: 0, z: 0 } }
            ]
        });

        // Setup memory with known locations
        await memoryModule.initialize({
            semanticMemory: {
                locations: {
                    beer_storage: ['refrigerator', 'garage_fridge', 'basement_cooler'],
                    refrigerator_contents: ['beer', 'milk', 'vegetables']
                }
            }
        });

        // Initialize skill pool
        await skillPool.loadSkills([
            'navigation',
            'object_manipulation',
            'refrigerator_interaction',
            'human_interaction'
        ]);
    }

    test('Complete beer fetch scenario', async () => {
        try {
            // 1. Simulate voice command reception
            const audioInput = {
                type: 'speech',
                transcript: 'pick me up a beer',
                confidence: 0.95,
                speakerId: 'commander'
            };

            // Process audio input
            await agent.modules.get('audio').processInput(audioInput);

            // 2. Verify command understanding
            const textProcessing = await agent.modules.get('text').processCommand(audioInput.transcript);
            expect(textProcessing.intent).toBe('fetch_object');
            expect(textProcessing.parameters.object).toBe('beer');

            // 3. Query memory for beer locations
            const possibleLocations = await memoryModule.query({
                type: 'location_query',
                object: 'beer',
                context: 'storage'
            });
            expect(possibleLocations).toContain('refrigerator');

            // 4. Plan and execute navigation
            const navigationPlan = await agent.planNavigation(
                environmentState.state.physical.agentPosition,
                possibleLocations[0].position
            );
            expect(navigationPlan.success).toBe(true);

            // 5. Execute refrigerator interaction
            const refrigeratorInteraction = await skillPool.executeSkill('refrigerator_interaction', {
                action: 'open',
                position: navigationPlan.destination
            });
            expect(refrigeratorInteraction.success).toBe(true);

            // 6. Execute object retrieval
            const beerRetrieval = await skillPool.executeSkill('object_manipulation', {
                action: 'grab',
                object: 'beer',
                container: 'refrigerator'
            });
            expect(beerRetrieval.success).toBe(true);

            // 7. Return to commander
            const returnNavigation = await agent.planNavigation(
                environmentState.state.physical.agentPosition,
                environmentState.state.physical.knownObjects.find(obj => obj.id === 'commander').position
            );
            expect(returnNavigation.success).toBe(true);

            // 8. Hand over object
            const handover = await skillPool.executeSkill('human_interaction', {
                action: 'handover',
                object: 'beer',
                target: 'commander'
            });
            expect(handover.success).toBe(true);

        } catch (error) {
            logger.error('Error in beer fetch scenario:', error);
            throw error;
        }
    });

    test('Handle refrigerator access failure', async () => {
        try {
            // Simulate refrigerator blocked scenario
            environmentState.updatePhysicalState({
                obstacles: [{
                    type: 'chair',
                    position: { x: 4, y: 0, z: -3 },
                    blocks: 'refrigerator'
                }]
            });

            const refrigeratorInteraction = await skillPool.executeSkill('refrigerator_interaction', {
                action: 'open',
                position: { x: 5, y: 0, z: -3 }
            });

            expect(refrigeratorInteraction.success).toBe(false);
            expect(refrigeratorInteraction.error.type).toBe('access_blocked');

            // Verify error handling and alternative action planning
            const errorHandling = await agent.handleTaskFailure({
                task: 'fetch_beer',
                error: refrigeratorInteraction.error,
                context: 'refrigerator_access'
            });

            expect(errorHandling.alternativePlan).toBeDefined();
            expect(errorHandling.userNotification).toBeDefined();
        } catch (error) {
            logger.error('Error in refrigerator access failure test:', error);
            throw error;
        }
    });
}); 