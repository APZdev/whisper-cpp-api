import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import { rm, writeFile } from 'fs/promises';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { absolutePath } from '../utils';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

const writeFileAsync = promisify(fs.writeFile);

export const convertAudioData = async (
  fileBuffer: Buffer,
  audioFormat: string,
  audioFrequency: 16000 | 48000
): Promise<Buffer | undefined> => {
  //Create a temporary file for ffmpeg to process
  const tempFileName = uuidv4();

  const inputFilePath = absolutePath(`temp/${tempFileName}.${audioFormat}`);
  const outputFilePath = absolutePath(`temp/${tempFileName}_output.${audioFormat}`);

  //Write temporary file to be processed by ffmpeg
  await writeFile(inputFilePath, fileBuffer);

  try {
    // Write the input video buffer to a temporary file
    await writeFileAsync(inputFilePath, fileBuffer);

    const command = ffmpeg(inputFilePath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(audioFrequency)
      .format('wav');

    command.output(outputFilePath);

    // Execute the ffmpeg command and wait for it to complete
    await new Promise<void>((resolve, reject) => {
      command.on('end', resolve);
      command.on('error', reject);
      command.run();
    });

    // Read the output WAV file into a buffer and return it
    const audioBuffer = await streamToBuffer(createReadStream(outputFilePath));
    return audioBuffer;
  } finally {
    // Clean up the temporary input and output files
    await rm(inputFilePath, { recursive: false, force: true });
    await rm(outputFilePath, { recursive: false, force: true });
  }
};

export const streamToBuffer = (stream: Readable): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
    stream.on('error', reject);
  });
};
