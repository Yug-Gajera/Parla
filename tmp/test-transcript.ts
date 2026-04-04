
import { getYouTubeTranscript } from './lib/watch/video-processor';

async function test() {
    const id = 'c4GbuEiTfFY';
    console.log(`Testing transcript for ${id}...`);
    const transcript = await getYouTubeTranscript(id);
    if (transcript) {
        console.log(`Success! Got ${transcript.length} segments.`);
        console.log('First 3 segments:', transcript.slice(0, 3));
    } else {
        console.log('Failed to get transcript.');
    }
}

test();
