// @ts-ignore: Deno-specific imports
// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno-specific imports
// @deno-types="https://esm.sh/@supabase/supabase-js@2"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore: Deno-specific imports
// @deno-types="https://esm.sh/marked@4.3.0"
import { marked } from "https://esm.sh/marked@4.3.0";

// @ts-ignore: Deno-specific globals
// Configuration
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
// @ts-ignore: Deno-specific globals
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
// @ts-ignore: Deno-specific globals
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
// @ts-ignore: Deno-specific globals
const APP_DOMAIN = Deno.env.get("NEXT_PUBLIC_APP_DOMAIN") || "getoneplace.com";
// @ts-ignore: Deno-specific globals
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
  source_url?: string;
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

    // Filter out summaries with no content
    const validSummaries = data.summaries.filter(summary => summary.summary);
    
    if (validSummaries.length === 0) {
      console.log(`No valid summaries to send to ${data.user.email}`);
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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .header {
              padding: 20px;
              background: linear-gradient(135deg, rgba(66, 99, 235, 0.1), rgba(92, 124, 250, 0.1));
              border-radius: 0.5rem 0.5rem 0 0;
              margin-bottom: 24px;
              text-align: center;
              border-bottom: 1px solid rgba(92, 124, 250, 0.2);
            }
            .header h1 {
              color: #4263eb;
              margin: 0;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: -0.025em;
            }
            .header p {
              color: #64748b;
              margin: 10px 0 0;
              font-size: 15px;
            }
            .channel-header {
              color: #4263eb;
              font-size: 20px;
              font-weight: bold;
              margin: 30px 0 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e2e8f0;
              letter-spacing: -0.025em;
            }
            .summary-card {
              margin-bottom: 30px;
              border: 1px solid #e2e8f0;
              border-radius: 0.5rem;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
              transition: all 0.2s ease;
            }
            .summary-header {
              padding: 16px 20px;
              background-color: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .title-container {
              flex: 1;
            }
            .summary-title {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
              color: #1e293b;
              padding-right: 15px;
              letter-spacing: -0.025em;
              line-height: 1.4;
            }
            .summary-title a {
              color: #4263eb;
              text-decoration: none;
            }
            .summary-title a:hover {
              text-decoration: underline;
            }
            .summary-date {
              font-size: 14px;
              color: #64748b;
              margin-top: 5px;
              display: block;
            }
            .summary-body {
              padding: 20px;
              background-color: #ffffff;
              text-align: left;
              position: relative;
              overflow: hidden;
            }
            .summary-body::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-size: 40px 40px;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0V0zm1 1v38h38V1H1z' fill='%234263eb' fill-opacity='0.03'/%3E%3C/svg%3E");
              pointer-events: none;
              z-index: 0;
            }
            .summary-content {
              color: #334155;
              line-height: 1.8;
              margin-left: 0;
              position: relative;
              z-index: 1;
            }
            .summary-content p {
              margin-top: 0;
              margin-bottom: 16px;
            }
            .summary-content ul {
              padding-left: 20px;
              margin-bottom: 16px;
            }
            .summary-content li {
              margin-bottom: 8px;
            }
            .chat-button-container {
              margin-top: 16px;
              text-align: center;
              position: relative;
              z-index: 1;
            }
            .chat-button {
              display: inline-block;
              background-color: #4263eb; /* Solid color fallback for email clients that don't support gradients */
              background: linear-gradient(135deg, #4263eb, #5c7cfa);
              color: #ffffff !important;
              font-weight: 500;
              font-size: 14px;
              padding: 8px 16px;
              border-radius: 6px;
              text-decoration: none;
              box-shadow: 0 2px 4px rgba(66, 99, 235, 0.2);
              transition: all 0.2s ease;
              mso-padding-alt: 8px 16px; /* Outlook specific padding */
            }
            .footer {
              text-align: center;
              padding: 24px 20px;
              background-color: #f8fafc;
              color: #64748b;
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
              margin-top: 30px;
              border-radius: 0 0 0.5rem 0.5rem;
            }
            .footer a {
              color: #4263eb;
              text-decoration: none;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .quote {
              font-style: italic;
              margin: 20px 0;
              padding: 12px 20px;
              border-left: 3px solid #4263eb;
              background-color: rgba(92, 124, 250, 0.05);
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
    const groupedSummaries = validSummaries.reduce((acc, summary) => {
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
        const summaryHtml = markdownToHtml(summary.summary);
        const titleLink = summary.source_url ? 
          `<a href="${summary.source_url}" target="_blank">${summary.title || 'Untitled Summary'}</a>` : 
          `${summary.title || 'Untitled Summary'}`;
        
        // Create the chat URL for the video
        const chatUrl = `https://${APP_DOMAIN}/chat/${summary.content_id}`;

        htmlContent += `
          <div class="summary-card">
            <div class="summary-header">
              <div class="title-container">
                <h2 class="summary-title">${titleLink}</h2>
                <span class="summary-date">${formattedDate}</span>
              </div>
            </div>
            <div class="summary-body">
              <div class="summary-content">
                ${summaryHtml || '<p>No summary content available.</p>'}
              </div>
        `;


        // Add the Chat with Video button with Outlook VML support
        htmlContent += `
            <div class="chat-button-container">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${chatUrl}" style="height:36px;v-text-anchor:middle;width:150px;" arcsize="16.7%" stroke="f" fillcolor="#4263eb">
                <w:anchorlock/>
                <center>
              <![endif]-->
              <a href="${chatUrl}" class="chat-button" target="_blank" style="background-color:#4263eb;border-radius:6px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:14px;font-weight:500;line-height:36px;text-align:center;text-decoration:none;width:150px;-webkit-text-size-adjust:none;">Chat with Video</a>
              <!--[if mso]>
                </center>
              </v:roundrect>
              <![endif]-->
            </div>
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
        subject: `OnePlace Daily Digest: ${validSummaries.length} New Summaries`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Failed to send email to ${data.user.email}:`, errorData);
      return false;
    }

    console.log(`Successfully sent email to ${data.user.email} with ${validSummaries.length} summaries`);
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
    
    // Get users who have at least one subscription
    const { data: usersWithSubscriptions, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("user_id")
      .order("user_id");
    
    if (subscriptionError) {
      clearTimeout(timeoutId);
      throw new Error(`Error fetching users with subscriptions: ${subscriptionError.message}`);
    }
    
    if (!usersWithSubscriptions || usersWithSubscriptions.length === 0) {
      console.log("No users with subscriptions found");
      clearTimeout(timeoutId);
      return new Response(
        JSON.stringify({
          message: "No users with subscriptions found",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    
    // Extract unique user IDs from subscriptions
    const uniqueUserIds = [...new Set(usersWithSubscriptions.map(sub => sub.user_id))];
    console.log(`Found ${uniqueUserIds.length} unique users with subscriptions`);
    
    // Get all users from auth.users that have subscriptions
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      clearTimeout(timeoutId);
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    
    // Filter users to only include those with subscriptions
    const subscribedUsers = users.users.filter(user => uniqueUserIds.includes(user.id));
    console.log(`Found ${subscribedUsers.length} subscribed users out of ${users.users.length} total users`);
    
    // Initialize results object
    const results = {
      processed: 0,
      emails_sent: 0,
      errors: 0,
      users: [] as Array<{ email: string; summaries_count: number; status: string }>,
    };
    
    // Process each user with subscriptions
    for (const user of subscribedUsers) {
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
        
        // Skip users without subscriptions (should not happen due to our filtering, but just in case)
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
        
        // Get new summaries from subscribed channels - now including source_url
        const { data: summaries, error: summariesError } = await supabase
          .from("summaries")
          .select("id, content_id, title, publisher_id, publisher_name, summary, content_created_at, created_at, source_url")
          .in("publisher_id", channelIds)
          .gt("content_created_at", cutoffDate.toISOString())
          .order("content_created_at", { ascending: false });
        
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
        
        // Filter out summaries with no content
        const validSummaries = summaries.filter(summary => summary.summary);
        
        if (validSummaries.length === 0) {
          console.log(`No valid summaries for user ${user.email}, skipping`);
          results.users.push({
            email: user.email,
            summaries_count: 0,
            status: "skipped_no_valid_summaries",
          });
          continue;
        }
        
        console.log(`Found ${validSummaries.length} valid summaries for user ${user.email}`);
        
        // Prepare email data
        const emailData: EmailData = {
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name,
          },
          summaries: validSummaries,
          channels: channelsMap,
        };
        
        // Send email
        const emailSent = await sendEmail(emailData);
        
        if (emailSent) {
          results.emails_sent++;
          results.users.push({
            email: user.email,
            summaries_count: validSummaries.length,
            status: "email_sent",
          });
        } else {
          results.errors++;
          results.users.push({
            email: user.email,
            summaries_count: validSummaries.length,
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