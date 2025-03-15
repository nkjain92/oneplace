// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="https://esm.sh/marked@4.3.0"
import { marked } from "https://esm.sh/marked@4.3.0";

// Configuration
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_DOMAIN = Deno.env.get("NEXT_PUBLIC_APP_DOMAIN") || "getsmart.vercel.app";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

// Constants
const PROCESS_TIMEOUT_MS = 55000; // 55 seconds timeout for the entire process
const HOURS_TO_CHECK = 24; // Check for summaries from the last 24 hours

// Types
interface User {
  id: string;
  email: string;
  name?: string;
}

interface Channel {
  id: string;
  name: string;
  thumbnail?: string;
}

interface Summary {
  id: string;
  content_id: string;
  title: string;
  publisher_id: string;
  publisher_name: string;
  summary: string;
  content_created_at: string;
  created_at: string;
  tags?: string[];
  featured_names?: string[];
}

interface EmailData {
  user: User;
  summaries: Summary[];
  channels: Record<string, Channel>;
}

// Function to convert markdown to HTML
function markdownToHtml(markdown: string): string {
  if (!markdown) {
    return ''; // Return empty string for null or undefined input
  }
  return marked(markdown);
}

// Function to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Function to send email using Resend
async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      return false;
    }

    if (data.summaries.length === 0) {
      console.log(`No new summaries to send to ${data.user.email}`);
      return true;
    }

    // Generate HTML content for the email
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Daily Summary Digest</title>
          <style>
            @font-face {
              font-family: 'Avenir';
              src: url('https://fonts.cdnfonts.com/css/avenir');
              font-weight: normal;
              font-style: normal;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              padding: 15px 20px;
              background-color: #f9f9f9;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 20px;
              text-align: center;
            }
            .header h1 {
              color: #d96c2e;
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            .header p {
              color: #666;
              margin: 10px 0 0;
            }
            .channel-header {
              color: #d96c2e;
              font-size: 20px;
              font-weight: bold;
              margin: 30px 0 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #f0f0f0;
            }
            .summary-card {
              margin-bottom: 30px;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 20px;
            }
            .summary-header {
              padding: 15px 20px;
              background-color: #f5f5f5;
              border-radius: 8px 8px 0 0;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #e0e0e0;
            }
            .title-container {
              flex: 1;
            }
            .summary-title {
              font-size: 20px;
              font-weight: bold;
              margin: 0;
              color: #d96c2e;
              padding-right: 15px;
            }
            .summary-date {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
              display: block;
            }
            .summary-body {
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 0 0 8px 8px;
              text-align: left;
            }
            .summary-content {
              color: #333;
              line-height: 1.8;
              margin-left: 0;
            }
            .summary-content p {
              margin-top: 0;
            }
            .summary-content ul {
              padding-left: 20px;
            }
            .people-section {
              margin-top: 15px;
              text-align: left;
            }
            .people-label {
              font-weight: bold;
              color: #666;
              margin-right: 8px;
            }
            .person {
              display: inline-block;
              background-color: #f0e6dd;
              color: #d96c2e;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              margin-right: 6px;
              margin-bottom: 6px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              background-color: #f0f0f0;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
              margin-top: 30px;
            }
            .quote {
              font-style: italic;
              margin: 20px 0;
              padding: 10px 20px;
              border-left: 3px solid #d96c2e;
              background-color: #f9f9f9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>OnePlace Daily Digest</h1>
              <p>Here's what's new from your subscribed channels</p>
            </div>
            <div class="content">
    `;

    // Group summaries by channel and sort by recency
    const groupedSummaries = data.summaries.reduce((acc, summary) => {
      const channelId = summary.publisher_id;
      if (!acc[channelId]) {
        acc[channelId] = [];
      }
      acc[channelId].push(summary);
      return acc;
    }, {} as Record<string, Summary[]>);

    Object.keys(groupedSummaries).forEach(channelId => {
      groupedSummaries[channelId].sort((a, b) => new Date(b.content_created_at).getTime() - new Date(a.content_created_at).getTime());
    });

    Object.keys(groupedSummaries).forEach(channelId => {
      const channelName = data.channels[channelId]?.name || 'Unknown Channel';
      htmlContent += `<h3 class="channel-header">${channelName}</h3>`;
      groupedSummaries[channelId].forEach(summary => {
        const formattedDate = formatDate(summary.content_created_at || summary.created_at);
        const summaryHtml = markdownToHtml(summary.summary || '');
        const people = summary.featured_names || [];

        htmlContent += `
          <div class="summary-card">
            <div class="summary-header">
              <div class="title-container">
                <h2 class="summary-title">${summary.title || 'Untitled Summary'}</h2>
                <span class="summary-date">${formattedDate}</span>
              </div>
            </div>
            <div class="summary-body">
              <div class="summary-content">
                ${summaryHtml || '<p>No summary content available.</p>'}
              </div>
        `;

        if (people.length > 0) {
          htmlContent += `
            <div class="people-section">
              <span class="people-label">People:</span>
              ${people.map(person => `<span class="person">${person}</span>`).join('')}
            </div>
          `;
        }

        htmlContent += `
            </div>
          </div>
        `;
      });
    });

    // Close the HTML content
    htmlContent += `
            </div>
            <div class="footer">
              <p>You received this email because you're subscribed to updates from OnePlace.</p>
              <p>
                <a href="https://${APP_DOMAIN}/settings/notifications" class="unsubscribe">
                  Manage email preferences
                </a>
              </p>
              <p>&copy; ${new Date().getFullYear()} OnePlace. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "OnePlace <newsletter@updates.getoneplace.com>",
        to: data.user.email,
        subject: `OnePlace Daily Digest: ${data.summaries.length} New Summaries`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to send email to ${data.user.email}:`, errorData);
      return false;
    }

    console.log(`Successfully sent email to ${data.user.email} with ${data.summaries.length} summaries`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${data.user.email}:`, error);
    return false;
  }
}

// Main function to handle the request
async function handleRequest(req: Request) {
  // Set a timeout to ensure the function doesn't run too long
  const timeoutId = setTimeout(() => {
    console.error("Function timed out after", PROCESS_TIMEOUT_MS, "ms");
    throw new Error(`Function timed out after ${PROCESS_TIMEOUT_MS}ms`);
  }, PROCESS_TIMEOUT_MS);

  // Record the start time for performance tracking
  const startTime = new Date();
  
  try {
    console.log(`Starting send-daily-newsletter function - Method: ${req.method}`);
    
    // Check if API key is set
    console.log(`RESEND_API_KEY set: ${!!RESEND_API_KEY}`);
    
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log("Supabase client created");
    
    // Check authorization for non-GET requests
    if (req.method !== "GET") {
      // Verify the request is from Supabase cron
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
        console.log("Unauthorized request");
        clearTimeout(timeoutId);
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
    }
    
    // Calculate the cutoff date (24 hours ago)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - HOURS_TO_CHECK);
    console.log(`Checking for summaries created after: ${cutoffDate.toISOString()}`);
    
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      clearTimeout(timeoutId);
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    
    console.log(`Found ${users.users.length} users`);
    
    // Initialize results object
    const results = {
      processed: 0,
      emails_sent: 0,
      errors: 0,
      users: [] as Array<{ email: string; summaries_count: number; status: string }>,
    };
    
    // Process each user
    for (const user of users.users) {
      try {
        // Skip users without email
        if (!user.email) {
          console.log("Skipping user without email");
          continue;
        }
        
        console.log(`Processing user: ${user.email}`);
        
        // Get user's subscribed channels
        const { data: subscriptions, error: subscriptionsError } = await supabase
          .from("subscriptions")
          .select("channel_id")
          .eq("user_id", user.id);
        
        if (subscriptionsError) {
          throw new Error(`Error fetching subscriptions: ${subscriptionsError.message}`);
        }
        
        // Skip users without subscriptions
        if (!subscriptions || subscriptions.length === 0) {
          console.log(`User ${user.email} has no subscriptions, skipping`);
          results.users.push({
            email: user.email,
            summaries_count: 0,
            status: "skipped_no_subscriptions",
          });
          continue;
        }
        
        const channelIds = subscriptions.map((sub) => sub.channel_id);
        console.log(`User ${user.email} has ${channelIds.length} subscribed channels`);
        
        // Get channels info
        const { data: channels, error: channelsError } = await supabase
          .from("channels")
          .select("id, name, thumbnail")
          .in("id", channelIds);
        
        if (channelsError) {
          throw new Error(`Error fetching channels: ${channelsError.message}`);
        }
        
        // Create a map of channel IDs to channel objects
        const channelsMap: Record<string, Channel> = {};
        channels?.forEach((channel) => {
          channelsMap[channel.id] = channel;
        });
        
        // Get new summaries from subscribed channels
        const { data: summaries, error: summariesError } = await supabase
          .from("summaries")
          .select("id, content_id, title, publisher_id, publisher_name, summary, content_created_at, created_at, tags, featured_names")
          .in("publisher_id", channelIds)
          .gt("created_at", cutoffDate.toISOString())
          .order("created_at", { ascending: false });
        
        if (summariesError) {
          throw new Error(`Error fetching summaries: ${summariesError.message}`);
        }
        
        // Skip users without new summaries
        if (!summaries || summaries.length === 0) {
          console.log(`No new summaries for user ${user.email}, skipping`);
          results.users.push({
            email: user.email,
            summaries_count: 0,
            status: "skipped_no_summaries",
          });
          continue;
        }
        
        console.log(`Found ${summaries.length} new summaries for user ${user.email}`);
        
        // Prepare email data
        const emailData: EmailData = {
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name,
          },
          summaries,
          channels: channelsMap,
        };
        
        // Send email
        const emailSent = await sendEmail(emailData);
        
        if (emailSent) {
          results.emails_sent++;
          results.users.push({
            email: user.email,
            summaries_count: summaries.length,
            status: "email_sent",
          });
        } else {
          results.errors++;
          results.users.push({
            email: user.email,
            summaries_count: summaries.length,
            status: "email_failed",
          });
        }
        
        results.processed++;
      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : String(userError);
        console.error(`Error processing user ${user.email}: ${errorMessage}`);
        results.errors++;
        results.users.push({
          email: user.email,
          summaries_count: 0,
          status: `error: ${errorMessage}`,
        });
      }
    }
    
    console.log("Function completed successfully");
    clearTimeout(timeoutId);
    
    // Return the results
    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();
    console.log(`Execution time: ${executionTime}ms`);
    
    // Create a response object
    const responseData = {
      message: "Daily newsletter job completed",
      timestamp: endTime.toISOString(),
      executionTime: `${executionTime}ms`,
      timeWindow: `${HOURS_TO_CHECK} hours`,
      cutoffDate: cutoffDate.toISOString(),
      summary: {
        processed: results.processed,
        emails_sent: results.emails_sent,
        errors: results.errors,
      },
      users: results.users,
    };
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Function error:", errorMessage);
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

// Start the server
serve(handleRequest); 