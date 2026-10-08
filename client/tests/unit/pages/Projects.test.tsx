import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Projects from '../../../src/pages/Projects';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient('https://mock.convex.cloud');

let queryNum = 0;
// Mock convex useQuery and useConvexAuth
vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useQuery: vi.fn().mockImplementation(() => {
      queryNum++;
      if (queryNum % 2 !== 0) {
        return { name: "Test User" };
      }
      return [
        { _id: "1", name: "Project Alpha" },
        { _id: "2", name: "Project Beta" }
      ];
    }),
    useConvexAuth: () => ({ isLoading: false, isAuthenticated: true }),
  };
});

// Mock child components
vi.mock('../../../src/components/layout/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));
vi.mock('../../../src/components/projects/ProjectCard', () => ({
  default: ({ project }: any) => <div data-testid="project-card">{project.name}</div>
}));
vi.mock('../../../src/components/projects/CreateProjectModal', () => ({
  default: () => <div data-testid="create-modal">Create Modal</div>
}));
vi.mock('../../../src/components/projects/ProjectSettingsModal', () => ({
  default: () => <div data-testid="settings-modal">Settings Modal</div>
}));

describe('Projects Page', () => {
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

    await waitFor(() => {
      expect(screen.getByText(/Test/i)).toBeInTheDocument();
      expect(screen.getByText(/Owner/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /New Project/i })).toBeInTheDocument();
    });
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
      const projectCards = screen.getAllByTestId('project-card');
      expect(projectCards.length).toBe(2);
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });
  });
});
