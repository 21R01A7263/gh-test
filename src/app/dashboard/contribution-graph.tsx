// src/app/dashboard/contribution-graph.tsx
import { auth, clerkClient } from '@clerk/nextjs/server';

interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number;
  color: string;
}

// Function to fetch contribution data for the last 30 days
async function getContributionData(
  token: string,
  from: string,
  to: string
): Promise<ContributionDay[] | null> {
  const headers = {
    Authorization: `bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const body = {
    query: `
      query($from: DateTime!, $to: DateTime!) {
        viewer {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                  date
                  weekday
                  color
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      from,
      to,
    },
  };

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error('Failed to fetch contribution data:', response.statusText);
    return null;
  }

  const data = await response.json();
  const calendar = data.data.viewer.contributionsCollection.contributionCalendar;
  let allDays: ContributionDay[] = [];
  calendar.weeks.forEach((week: { contributionDays: ContributionDay[] }) => {
    allDays.push(...week.contributionDays);
  });
  return allDays.slice(-30);
}

// Component to render the contribution graph
const ContributionGraph = async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);

  const toISO = to.toISOString();
  const fromISO = from.toISOString();

  const client = await clerkClient();
  const clerkResponse = await client.users.getUserOauthAccessToken(
    userId,
    'github'
  );

  const githubToken = clerkResponse.data?.[0]?.token;

  if (!githubToken) {
    return <p>GitHub token not found.</p>;
  }

  const contributionDays = await getContributionData(
    githubToken,
    fromISO,
    toISO
  );

  if (!contributionDays) {
    return <p>Could not load contribution data.</p>;
  }

  // Create a 6x5 grid of contribution days
  const grid: ContributionDay[][] = [];
  for (let i = 0; i < 6; i++) {
    grid.push(contributionDays.slice(i * 5, i * 5 + 5));
  }

  return (
    <div className='w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mt-8'>
      <h2 className='text-2xl font-semibold text-gray-700 mb-6 border-b pb-4'>
        Last 30 Days of Contributions
      </h2>
      <div className='flex flex-col gap-1'>
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className='flex gap-1'>
            {row.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className='w-4 h-4 m-0.5 rounded-sm hover:scale-110'
                style={{ backgroundColor: day.color }}
                title={`${day.contributionCount} contributions on ${new Date(day.date).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }).replace(',',',')}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributionGraph;