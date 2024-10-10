"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Octokit } from '@octokit/rest';

// ... (keep existing interfaces and type definitions)

const octokit = new Octokit();

const PRAnalysis = () => {
  // ... (keep existing state and other functions)

  const analyzePR = async () => {
    setLoading(true);
    try {
      const { owner, repo, pull_number } = parsePRUrl(prUrl);
      
      // Fetch PR data
      const { data: prData } = await octokit.pulls.get({
        owner,
        repo,
        pull_number,
      });

      // Fetch PR comments
      const { data: comments } = await octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number,
      });

      // Fetch the PR diff to get code context
      const { data: prDiff } = await octokit.pulls.get({
        owner,
        repo,
        pull_number,
        mediaType: {
          format: 'diff'
        }
      });

      const developerAnalysis = await categorizePRComments(comments, prDiff);
      const totalComments = calculateTotalComments(developerAnalysis);
      const averageScore = calculateAverageScore(developerAnalysis);

      setResult({
        totalTechnicalComments: totalComments.technical,
        totalNonTechnicalComments: totalComments.nonTechnical,
        totalNitComments: totalComments.nit,
        averageScore,
        developerAnalysis,
      });
    } catch (error) {
      console.error('Error analyzing PR:', error);
      // TODO: Handle error (e.g., show error message to user)
    } finally {
      setLoading(false);
    }
  };

  const categorizePRComments = async (comments: any[], prDiff: string): Promise<DeveloperAnalysis[]> => {
    const developerComments: { [key: string]: { technical: number, nonTechnical: number, nit: number } } = {};

    for (const comment of comments) {
      const developer = comment.user.login;
      if (!developerComments[developer]) {
        developerComments[developer] = { technical: 0, nonTechnical: 0, nit: 0 };
      }

      // Extract relevant code context
      const codeContext = extractCodeContext(prDiff, comment.path, comment.position);

      // Send to LLM for categorization
      const category = await categorizeLLM(comment.body, codeContext);

      developerComments[developer][category]++;
    }

    return Object.entries(developerComments).map(([name, counts]) => ({
      name,
      technicalComments: counts.technical,
      nonTechnicalComments: counts.nonTechnical,
      nitComments: counts.nit,
      score: calculateDeveloperScore(counts),
    }));
  };

  const extractCodeContext = (prDiff: string, filePath: string, position: number): string => {
    // Implementation to extract relevant code context from PR diff
    // This is a simplified version and might need to be more sophisticated
    const fileLines = prDiff.split('\n');
    const relevantLines = fileLines.slice(Math.max(0, position - 5), position + 5);
    return relevantLines.join('\n');
  };

  const categorizeLLM = async (commentBody: string, codeContext: string): Promise<'technical' | 'nonTechnical' | 'nit'> => {
    try {
      const response = await fetch('/api/categorize-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentBody, codeContext }),
      });

      if (!response.ok) {
        throw new Error('Failed to categorize comment');
      }

      const result = await response.json();
      return result.category;
    } catch (error) {
      console.error('Error categorizing comment:', error);
      // Fallback to simple categorization if LLM fails
      return commentBody.length > 100 ? 'technical' : (commentBody.toLowerCase().includes('nit') ? 'nit' : 'nonTechnical');
    }
  };

  // ... (keep the rest of the component code)

  return (
    // ... (keep the existing JSX)
  );
};

export default PRAnalysis;