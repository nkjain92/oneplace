# youtube-transcript-api info:

const http = require('https');

const options = {
method: 'GET',
hostname: 'youtube-transcript3.p.rapidapi.com',
port: null,
path: '/api/transcript?videoId=ZacjOVVgoLY',
headers: {
'x-rapidapi-key': 'fb3f0acafdmsh409d48594da062ap1b22e3jsn034f696e4c63',
'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com'
}
};

const req = http.request(options, function (res) {
const chunks = [];

    res.on('data', function (chunk) {
    	chunks.push(chunk);
    });

    res.on('end', function () {
    	const body = Buffer.concat(chunks);
    	console.log(body.toString());
    });

});

req.end();

# types of youtube links to handle

YouTube Video URL Formats
Standard Watch Page
https://www.youtube.com/watch?v=VIDEO_ID
Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ

Shortened Link (youtu.be)
https://youtu.be/VIDEO_ID
Example: https://youtu.be/dQw4w9WgXcQ
Supports optional parameters like ?t=30s for timestamps.

Embed URLs
https://www.youtube.com/embed/VIDEO_ID
Example: https://www.youtube.com/embed/dQw4w9WgXcQ

Legacy /v/ Path
https://www.youtube.com/v/VIDEO_ID
Example: https://www.youtube.com/v/dQw4w9WgXcQ

Shorts Format
https://www.youtube.com/shorts/VIDEO_ID
Example: https://www.youtube.com/shorts/dQw4w9WgXcQ

URLs with Extra Parameters
https://www.youtube.com/watch?feature=shared&v=VIDEO_ID
The v= parameter may appear after other query parameters.

Live Stream URLs
https://www.youtube.com/live/VIDEO_ID
Example: https://www.youtube.com/live/dQw4w9WgXcQ

OEmbed Links
https://www.youtube.com/oembed?url=http%3A//youtube.com/watch%3Fv%3DVIDEO_ID
The video ID is embedded within a URL-encoded string.
