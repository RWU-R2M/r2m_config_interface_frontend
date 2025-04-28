# Testing Strategy

## Types of Tests
- **Unit Tests**: For Vuex store logic, utility functions, and API service
- **Component Tests**: For Vue components (UI, props, events)
- **Integration Tests**: For API communication and module interaction

## Tools
- [Vitest](https://vitest.dev/) for unit/component tests
- Mocking for API responses

## Running Tests
```bash
npm run test
```

## Coverage
- Minimum 70% code coverage required
- Coverage reports generated with `npm run test:coverage`

## Best Practices
- Mock API calls in tests
- Test error and loading states
- Use descriptive test names
