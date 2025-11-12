import { render } from '@testing-library/react';
import App from './App';

// PUBLIC_INTERFACE
test('renders app without crashing', () => {
  /** Minimal smoke test to ensure App mounts successfully. */
  render(<App />);
});
