import { describe, it, expect } from 'vitest';
import { render, screen } from './test-utils';

// Simple smoke test to verify test setup works
describe('Test Setup', () => {
  it('should render test correctly', () => {
    const { container } = render(<div>Test Component</div>);
    expect(container).toBeInTheDocument();
  });

  it('should find text content', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});

// Example test structure for when you create component tests
describe('Component Testing Examples', () => {
  it('example: testing a button click', () => {
    const { getByRole } = render(
      <button onClick={() => {}}>Click Me</button>
    );
    const button = getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('example: testing form inputs', () => {
    const { getByLabelText } = render(
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
      </form>
    );
    const input = getByLabelText(/email/i);
    expect(input).toBeInTheDocument();
  });
});
