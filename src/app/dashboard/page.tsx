// src/app/dashboard/page.tsx
import { auth, clerkClient } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import ContributionGraph from './contribution-graph';

// Define an interface for the repository data structure for type safety
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
}

export default async function DashboardPage() {
  // Get the userId from the authenticated session
  const { userId } = await auth();

  if (!userId) {
    // This case should ideally be handled by the middleware,
    // but it's a good practice for robustness.
    return (
      <div className='p-8'>
        <p>You must be signed in to view this page.</p>
      </div>
    );
  }

  let repoNames: string[] = [];
  let error: string | null = null;

  try {
    // Retrieve the user's GitHub OAuth access token from Clerk
    const client = await clerkClient();
    const clerkResponse = await client.users.getUserOauthAccessToken(
      userId,
      'github'
    );

    const githubToken = clerkResponse.data?.[0]?.token;

    if (!githubToken) {
      throw new Error('GitHub OAuth token not found.');
    }

    // Fetch the user's repositories from the GitHub API
    const repoResponse = await fetch(
      'https://api.github.com/user/repos?sort=pushed&per_page=3',
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'User-Agent': 'Nextjs-Clerk-Repo-Viewer',
          Accept: 'application/vnd.github.v3+json',
        },
        // next: { revalidate: 3600 }
      }
    );

    if (!repoResponse.ok) {
      throw new Error(
        `Failed to fetch repositories. Status: ${repoResponse.status}`
      );
    }

    const repos: GitHubRepo[] = await repoResponse.json();
    repoNames = repos.map((repo) => repo.name);
  } catch (e: any) {
    console.error('Error fetching repository data:', e);
    error = e.message || 'An unexpected error occurred.';
  }

  return (
    <main className='flex min-h-screen flex-col items-center bg-gray-50 p-4 sm:p-8'>
      <header className='w-full max-w-4xl flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-800'>Your Dashboard</h1>
        <div className='scale-125'>
          <UserButton
            userProfileProps={{
              additionalOAuthScopes: {
                github: ['repo'],
              },
            }}
          />
        </div>
      </header>
      <div className='w-full max-w-4xl bg-white p-8 rounded-lg shadow-md'>
        <h2 className='text-2xl font-semibold text-gray-700 mb-6 border-b pb-4'>
          Latest 3 Repositories
        </h2>
        {error ? (
          <div className='text-red-500 bg-red-100 p-4 rounded-md'>
            <p>
              <strong>Error:</strong> {error}
            </p>
            <p className='mt-2 text-sm'>
              Please ensure your GitHub account is correctly linked and has
              granted the necessary permissions.
            </p>
          </div>
        ) : repoNames.length > 0 ? (
          <div className='space-y-4'>
            {repoNames.map((name, index) => (
              <p
                key={index}
                className='text-lg text-gray-800 p-4 bg-gray-100 rounded-md'
              >
                {name}
              </p>
            ))}
          </div>
        ) : (
          <p className='text-gray-500'>No repositories found.</p>
        )}
      </div>
      <ContributionGraph />
    </main>
  );
}