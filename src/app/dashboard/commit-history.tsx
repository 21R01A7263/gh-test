// src/app/dashboard/commit-history.tsx
import { auth, clerkClient } from '@clerk/nextjs/server';
import CommitHistoryUI from './commit-history-client'; // Import the new client component

// Define interfaces for type safety
interface GitHubRepo {
  full_name: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

// This backend function remains unchanged
async function getCommitHistory(token: string): Promise<GitHubCommit[] | null> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Nextjs-Clerk-Commit-Viewer',
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    const repoResponse = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=100', { headers });
    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch repositories. Status: ${repoResponse.status}`);
    }
    const repos: GitHubRepo[] = await repoResponse.json();

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);
    const sinceISO = sinceDate.toISOString();

    const commitPromises = repos.map(async (repo) => {
      const commitResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/commits?since=${sinceISO}`,
        { headers }
      );
      if (!commitResponse.ok) {
        console.error(`Failed to fetch commits for ${repo.full_name}. Status: ${commitResponse.status}`);
        return [];
      }
      return commitResponse.json() as Promise<GitHubCommit[]>;
    });

    const commitsByRepo = await Promise.all(commitPromises);
    
    const allCommits = commitsByRepo.flat();
    allCommits.sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime());

    return allCommits;
  } catch (error) {
    console.error('Error fetching commit history:', error);
    return null;
  }
}

// Server Component: Fetches data and passes it to the client component
const CommitHistory = async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const client = await clerkClient();
  const clerkResponse = await client.users.getUserOauthAccessToken(userId, 'github');
  const githubToken = clerkResponse.data?.[0]?.token;

  if (!githubToken) {
    return (
      <div className='w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mt-8'>
        <h2 className='text-2xl font-semibold text-gray-700 mb-6 border-b pb-4'>
          Commit History (Last 30 Days)
        </h2>
        <p className='text-red-500'>GitHub token not found. Please reconnect your GitHub account.</p>
      </div>
    );
  }

  const commits = await getCommitHistory(githubToken);

  if (commits === null) {
     return (
        <div className='w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mt-8'>
            <h2 className='text-2xl font-semibold text-gray-700 mb-6 border-b pb-4'>
                Commit History (Last 30 Days)
            </h2>
            <p className='text-red-500'>Could not load commit history.</p>
        </div>
     );
  }

  // Render the client component and pass the fetched commits as a prop
  return <CommitHistoryUI commits={commits} />;
};

export default CommitHistory;