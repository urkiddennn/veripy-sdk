import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Projects from './Projects';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient('https://mock.convex.cloud');

let queryNum = 0;
// Mock convex useQuery
vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useQuery: vi.fn().mockImplementation(() => {
      // Since useQuery is called twice in the component (user, then projects)
      queryNum++;
      if (queryNum % 2 !== 0) { // First call in a render cycle = user
        return { name: "Test User" };
      }
      return [ // Second call in a render cycle = projects
        { _id: "1", name: "Project Alpha" },
        { _id: "2", name: "Project Beta" }
      ];
    }),
  };
});

// Mock child components
vi.mock('../components/layout/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));
vi.mock('../components/projects/ProjectCard', () => ({
  default: ({ project }: any) => <div data-testid="project-card">{project.name}</div>
}));
vi.mock('../components/projects/CreateProjectModal', () => ({
  default: () => <div data-testid="create-modal">Create Modal</div>
}));
vi.mock('../components/projects/ProjectSettingsModal', () => ({
  default: () => <div data-testid="settings-modal">Settings Modal</div>
}));

describe('Projects Page', () => {
  // Mock localStorage for test
  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mock_user_id');
    queryNum = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders projects page correctly', async () => {
    render(
      <ConvexProvider client={convex}>
        <MemoryRouter>
          <Projects />
        </MemoryRouter>
      </ConvexProvider>
    );

    // Let's actually check if it renders the loading state first or what.
    // Our mock returned an object for the first call and array for the second initially.
    // If it's returning Loading... because user or projects is undefined:
    
    // Use waitFor to allow states to settle
    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /New Project/i })).toBeInTheDocument();
  });

  it('renders a list of projects', async () => {
    render(
      <ConvexProvider client={convex}>
        <MemoryRouter>
          <Projects />
        </MemoryRouter>
      </ConvexProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getAllByTestId('project-card')).toHaveLength(2);
    });
  });
});
