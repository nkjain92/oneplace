import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface SummaryGeneratorProps {
  onSummaryGenerated: (summary: any) => void;
  onLoading: (isLoading: boolean) => void;
}

export default function SummaryGenerator({ onSummaryGenerated, onLoading }: SummaryGeneratorProps) {
  const [url, setUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const generateSummary = useCallback(async () => {
    if (!url) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube URL',
        variant: 'destructive',
      });
      return;
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid YouTube URL',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    onLoading(true);

    try {
      // Set up a timeout to detect stalled requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 20000);
      });

      // Create the actual fetch request
      const fetchPromise = fetch('/api/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      onSummaryGenerated(data);
      setRetryCount(0); // Reset retry count on success
      
      toast({
        title: 'Success',
        description: 'Summary generated successfully',
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check if we should retry
      if (retryCount < 2 && (
          errorMessage.includes('timeout') || 
          errorMessage.includes('network') ||
          errorMessage.includes('failed to fetch')
        )) {
        setRetryCount(prev => prev + 1);
        
        toast({
          title: 'Retrying...',
          description: `Connection issue detected. Retrying (${retryCount + 1}/3)...`,
        });
        
        // Wait a moment before retrying
        setTimeout(() => {
          generateSummary();
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
      onLoading(false);
    }
  }, [url, onSummaryGenerated, onLoading, toast, retryCount]);

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
          disabled={isGenerating}
        />
        <Button 
          onClick={generateSummary} 
          disabled={isGenerating || !url}
          className="min-w-[120px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>
      {retryCount > 0 && (
        <div className="text-amber-500 text-sm">
          Connection issue detected. Retry attempt {retryCount}/3...
        </div>
      )}
    </div>
  );
} 