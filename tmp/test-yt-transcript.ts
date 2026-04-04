import { YoutubeTranscript } from 'youtube-transcript';

async function test() {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript('Irhfx_Zj9sQ');
        console.log(`Success! Got ${transcript.length} segments.`);
        console.log('First 2:', transcript.slice(0, 2));
    } catch (err) {
        console.error('Error fetching transcript:', err);
    }
}
test();
