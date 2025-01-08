import { Logger } from '../../utils/Logger.js';
import { EventEmitter } from 'events';

export class SkillPool extends EventEmitter {
    constructor() {
        super();
        this.logger = new Logger('SkillPool');
        this.skills = new Map();
        this.activeSkills = new Set();
    }

    async loadSkills(skillList) {
        try {
            for (const skillName of skillList) {
                const skillModule = await import(`./skills/${skillName}.js`);
                this.skills.set(skillName, skillModule.default);
                this.logger.info(`Loaded skill: ${skillName}`);
            }
        } catch (error) {
            this.logger.error('Error loading skills:', error);
            throw error;
        }
    }

    async executeSkill(skillName, parameters) {
        if (!this.skills.has(skillName)) {
            throw new Error(`Skill not found: ${skillName}`);
        }

        try {
            this.logger.info(`Executing skill: ${skillName}`);
            this.activeSkills.add(skillName);

            const skill = this.skills.get(skillName);
            const result = await skill.execute(parameters);

            this.activeSkills.delete(skillName);
            this.emit('skill_completed', { skill: skillName, result });

            return result;
        } catch (error) {
            this.activeSkills.delete(skillName);
            this.logger.error(`Error executing skill ${skillName}:`, error);
            
            const enhancedError = {
                type: 'skill_execution_error',
                skillName,
                originalError: error,
                parameters,
                timestamp: Date.now()
            };

            this.emit('skill_error', enhancedError);
            throw enhancedError;
        }
    }

    async abortSkill(skillName) {
        if (this.activeSkills.has(skillName)) {
            try {
                const skill = this.skills.get(skillName);
                await skill.abort();
                this.activeSkills.delete(skillName);
                this.logger.info(`Aborted skill: ${skillName}`);
            } catch (error) {
                this.logger.error(`Error aborting skill ${skillName}:`, error);
                throw error;
            }
        }
    }
} 