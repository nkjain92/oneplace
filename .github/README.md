# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automating tasks in the GetSmart project.

## Workflows

### `schedule-check-videos.yml`

This workflow runs every 30 minutes to trigger the Supabase Edge Function `check-new-videos`.

#### Configuration

The workflow requires the following secrets to be set in the repository:

- `SUPABASE_FUNCTION_URL`: The full URL to your deployed edge function (e.g., `https://[project-ref].supabase.co/functions/v1/check-new-videos`)
- `CRON_SECRET`: The secret used for authentication with the edge function

#### Manual Triggering

You can manually trigger this workflow from the "Actions" tab in the GitHub repository by selecting the "Schedule Check New Videos" workflow and clicking "Run workflow".

#### Monitoring

Check the "Actions" tab in the GitHub repository to monitor the execution of this workflow. Each run will show whether the function was triggered successfully.
