# WhisperCpp API

This API allows you to do a simple POST request and get returned a word-level timestamped transcription in the SRT format
Note that this project is full of spaghetti code and bad practices, please don't use it to learn 😂💀.
I just put it out there so you guys can get a great transcription API running quickly 😉.

## Features

- Supported formats : wav, mp3
- Developement build uses the small whispercpp model (faster, but less accurate)
- Production build uses the large whispercpp model (slower, but more accurate)

## Requirements

- You should have Docker installed
- You should have above 100IQ

You need to download two WhisperCpp models [=> Download Models <=](https://huggingface.co/ggerganov/whisper.cpp/tree/main)

- ggml-medium.bin
- ggml-small.bin

Place both models inside the models folder

```
whispercpp/models/[here]
```

## Run Locally

Go to the project directory

```bash
  cd whisper-cpp-api
```

Install dependencies

```bash
  pnpm install
```

Run project in 'developement' mode

```bash
  docker compose up -d --build
```

Build project locally in 'production' mode (test before pushing image to google cloud)

```bash
  docker build -t whisper-cpp-api .
  docker run --env-file ./.env.production -p 8080:8080 whisper-cpp-api
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env.dev & .env.production file

- `NODE_ENV`
- `PORT`
- `API_KEY`

## API Reference

#### Check API is running

```
  GET /
```

#### Expected result

```
 🟢 WhisperCpp API Running
```

#### POST

```
  POST /transcript
```

| Header      | Type     | Description           |
| :---------- | :------- | :-------------------- |
| `x-api-key` | `string` | **Required**. Api key |

| Parameter               | Type     | Description                                            |
| :---------------------- | :------- | :----------------------------------------------------- |
| `base64AudioFileBuffer` | `string` | **Required**. The audio data encoded as base 64 string |
| `fileExtension`         | `string` | **Required**. Audio file extension (E.g. "wav", "mp3") |
| `lang`                  | `string` | **Required**. Target audio file language               |

| Result       | Type     | Description              |
| :----------- | :------- | :----------------------- |
| `transcript` | `string` | { "transcript": string } |

#### Expected result (Example SRT Output)

```json
{
  "transcript": "1\n00:00:00,810 --> 00:00:01,440\n Hello\n\n2\n00:00:01,440 --> 00:00:02,360\n World !\n\n"
}
```
