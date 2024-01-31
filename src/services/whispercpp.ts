//Convert these to require import statements
import { asyncExec } from 'async-shelljs';
import { parseSync, stringifySync } from 'subtitle';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { API_IS_PRODUCTION } from '../constants/status';
import { absolutePath } from '../utils';
import { existsSync } from 'fs';

interface Subtitle {
  type: 'cue';
  data: {
    start: number; // milliseconds
    end: number;
    text: string;
  };
}

const fixWordBreaks = (srt: string): string => {
  // Parse the SRT string
  const subtitles = parseSync(srt) as Subtitle[];

  // Iterate through the subtitles and fix word breaks
  for (let i = 1; i < subtitles.length; i++) {
    const currentSubtitle = subtitles[i];
    const previousSubtitle = subtitles[i - 1];

    // Check if the current subtitle's text doesn't start with a space
    if (currentSubtitle.data.text[0] !== ' ') {
      // Join the current subtitle's text with the previous subtitle's text
      previousSubtitle.data.text += currentSubtitle.data.text;

      // Adjust the end time of the previous subtitle to match the end time of the current subtitle
      previousSubtitle.data.end = currentSubtitle.data.end;

      // Remove the current subtitle from the array
      subtitles.splice(i, 1);

      // Decrement the index to correctly process the next subtitle
      i--;
    }
  }

  // Adjust the timings of segments containing only punctuation
  for (let i = 0; i < subtitles.length; i++) {
    const subtitle = subtitles[i];
    const text = subtitle.data.text.trim();

    if (/^[!?.,]+$/.test(text)) {
      const previousSubtitle = subtitles[i - 1];

      if (previousSubtitle) {
        // Check to add a space before the punctuation
        if (/^[!?]+$/.test(text)) {
          previousSubtitle.data.text += ' ' + text;
        } else {
          previousSubtitle.data.text += text;
        }
        previousSubtitle.data.end = subtitle.data.end;

        subtitles.splice(i, 1);
        i--;
      }
    }
  }

  // Remove empty subtitles
  const finalSubtitles = subtitles.filter((subtitle) => subtitle.data.text.trim() !== '');

  // Convert the fixed subtitles back to SRT string
  return stringifySync(finalSubtitles, { format: 'SRT' });
};

// const applyOffset = (srt: string, offset: number): string => {
//   // Parse the SRT string
//   const subtitles = parseSync(srt) as Subtitle[];

//   // Apply the time offset to all the subtitles
//   for (const subtitle of subtitles) {
//     subtitle.data.start += offset;
//     subtitle.data.end += offset;
//   }

//   // Convert the modified subtitles back to SRT string
//   return stringifySync(subtitles, { format: 'SRT' });
// };

export const transcriptWavFileWhisperCpp = async (
  wavFileBuffer: Buffer,
  projectLanguage: string
): Promise<string> => {
  const tempFileUuid = uuidv4();

  //Check if the temp folder exists, if not create it
  const tempFolderPath = absolutePath('temp');
  if (!existsSync(tempFolderPath)) {
    await mkdir(tempFolderPath);
  }

  const extractedAudioFilePath = absolutePath(`temp/${tempFileUuid}.wav`);

  await writeFile(extractedAudioFilePath, wavFileBuffer);

  const MODEL_PATH = API_IS_PRODUCTION
    ? absolutePath('whispercpp/models/ggml-medium.bin')
    : absolutePath('whispercpp/models/ggml-small.bin');

  const WHISPER_ENTRYPOINT = absolutePath('whispercpp/main');

  const command = `${WHISPER_ENTRYPOINT} -f "${extractedAudioFilePath}" -m ${MODEL_PATH} -l ${projectLanguage} -ml 1 -osrt`;

  await asyncExec(command, { silent: true });

  const srtFilePath = `${extractedAudioFilePath}.srt`;
  const textData = await readFile(srtFilePath, 'utf8');

  const fixedSrt = fixWordBreaks(textData);

  rm(srtFilePath, { force: true });

  //Delete temporary audio file
  await rm(extractedAudioFilePath, { recursive: false, force: true });

  return fixedSrt;
};
