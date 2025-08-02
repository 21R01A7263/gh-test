"use client";

import { useState } from 'react';

// Define the type for a single commit object
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

// The UI component that handles pagination state
export default function CommitHistoryUI({ commits }: { commits: GitHubCommit[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const commitsPerPage = 5;

  // Pagination logic
  const indexOfLastCommit = currentPage * commitsPerPage;
  const indexOfFirstCommit = indexOfLastCommit - commitsPerPage;
  const currentCommits = commits.slice(indexOfFirstCommit, indexOfLastCommit);
  const totalPages = Math.ceil(commits.length / commitsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className='w-full max-w-4xl bg-white p-8 rounded-lg shadow-md mt-8'>
      <h2 className='text-2xl font-semibold text-gray-700 mb-6 border-b pb-4'>
        Commit History (Last 30 Days)
      </h2>
      {commits.length > 0 ? (
        <>
          <ul className='space-y-3 mb-6 min-h-[350px]'> {/* Added min-height to prevent layout shift */}
            {currentCommits.map((commit) => (
              <li key={commit.sha} className='text-sm text-gray-800 p-3 bg-gray-50 rounded-md flex justify-between items-center'>
                <div>
                  <p className='font-mono text-gray-600' title={commit.sha}>{commit.sha.substring(0, 7)}</p>
                  <p className='font-semibold'>{commit.commit.message.split('\n')[0]}</p>
                   <p className='text-xs text-gray-500'>
                     by {commit.commit.author.name} on {new Date(commit.commit.author.date).toLocaleDateString()}
                  </p>
                </div>
                <a 
                  href={commit.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 font-semibold text-xs ml-4 flex-shrink-0"
                >
                  View Commit
                </a>
              </li>
            ))}
          </ul>
          <div className='flex justify-between items-center'>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300'
            >
              Previous
            </button>
            <span className='text-sm text-gray-600'>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className='px-4 py-2 bg-gray-200 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300'
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className='text-gray-500'>No commits found in the last 30 days.</p>
      )}
    </div>
  );
}