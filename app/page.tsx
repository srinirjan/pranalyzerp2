import PRAnalysis from '@/components/pr-analysis';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">GitHub PR Analysis</h1>
      <PRAnalysis />
    </div>
  );
}