# API Reference

## AgentOrchestrator

### Constructor
```typescript
constructor(options: AgentOptions)
```

### Methods
#### initialize()
Initializes the agent and all enabled modules.

```typescript
async initialize(): Promise<void>
```

#### processInput()
Processes input through the appropriate modules.

```typescript
async processInput(input: any): Promise<ProcessedOutput>
```

## Modules

### Vision Module
[API documentation for vision module...]

### Audio Module
[API documentation for audio module...]

[Additional API documentation...] 