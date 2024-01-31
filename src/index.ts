import bodyParser from 'body-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { API_IS_PRODUCTION, API_LAUNCH_ENV, PORT } from './constants/status';
import { convertAudioData } from './services/convertAudioData';
import { transcriptWavFileWhisperCpp } from './services/whispercpp';
import { SubtitleRequest } from './types/postTypes';
import { absolutePath } from './utils';

const app = express();

app.use(bodyParser.json({ limit: '1gb' }));
app.use(bodyParser.urlencoded({ limit: '1gb', extended: true }));

//Allow CORS
const allowedOrigins = ['*'];

if (!API_IS_PRODUCTION) {
  allowedOrigins.push('*');
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['x-api-key'] === process.env.API_KEY) {
    return next();
  } else {
    console.log('Unauthorized');
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

app.use(auth);

app.use(
  cors({
    origin: allowedOrigins,
  })
);

//Create a temp folder if it doesn't exist
if (!existsSync(absolutePath('temp'))) {
  mkdirSync(absolutePath('temp'));
}

app.get('/', async (req, res) => {
  return res.status(200).json({ status: '🟢 WhisperCPP API Running' });
});

app.post('/transcript', async (req: SubtitleRequest, res) => {
  const { base64AudioFileBuffer, audioFormat, lang } = req.body;

  const wavFileBuffer = Buffer.from(base64AudioFileBuffer, 'base64');

  console.log('Started processing audio file');

  // Audio file should be in a specific format with a specific audio codec to be processed by WhisperCpp
  // Format : WAV
  // Codec : pcm_s16le
  const correctlyFormattedWavFileBuffer = await convertAudioData(wavFileBuffer, audioFormat, 16000);

  if (!correctlyFormattedWavFileBuffer) {
    return res.status(500).json({ error: 'Internal server error !' });
  } else {
    console.log('Finished processing audio file');
  }

  try {
    console.log('Started transcription');

    const transcription = await transcriptWavFileWhisperCpp(correctlyFormattedWavFileBuffer, lang);

    console.log('Finished transcription');

    return res.status(200).json({ transcript: transcription });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
});

app.listen(PORT, () => {
  console.log(`\n\n 🟢   WhisperCPP API Running in ${API_LAUNCH_ENV} mode at http://localhost:${PORT} \n\n`);
});
