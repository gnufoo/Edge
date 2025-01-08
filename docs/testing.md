# Testing Guide

## Testing Framework
Agent Core uses Jest for unit testing and integration testing.

## Test Structure
```
tests/
├── unit/
│   ├── modules/
│   ├── orchestrator/
│   └── config/
├── integration/
└── e2e/
```

## Writing Tests

### Unit Tests
```typescript
describe('VisionModule', () => {
  let visionModule;

  beforeEach(() => {
    visionModule = new VisionModule(mockConfig);
  });

  test('should initialize correctly', async () => {
    await visionModule.initialize();
    expect(visionModule.isInitialized).toBe(true);
  });

  test('should process image input', async () => {
    const result = await visionModule.process(mockImageData);
    expect(result).toHaveProperty('detection');
  });
});
```

### Integration Tests
```typescript
describe('Module Integration', () => {
  test('vision and text modules should work together', async () => {
    const orchestrator = new AgentOrchestrator({
      modules: {
        vision: true,
        text: true
      }
    });
    
    const result = await orchestrator.process({
      type: 'image',
      data: mockImageData
    });
    
    expect(result).toHaveProperty('description');
  });
});
```

## Test Coverage
- Maintain minimum 80% coverage
- Critical paths require 100% coverage
- Regular coverage reports

## Mocking
Examples of mocking different components:
- External APIs
- File System
- Database
- Module Communications 