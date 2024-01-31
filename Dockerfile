# Stage 1: Install dependencies
FROM ubuntu:latest as development

WORKDIR /usr/src/app

# Install ffmpeg globally. FFMPEG is used to process audio to make it compatible with whispercpp
RUN apt-get update && apt-get install -y ffmpeg

# Install OS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN apt-get update -yq \
    && curl -L https://deb.nodesource.com/setup_18.x | bash \
    && apt-get update -yq \
    && apt-get install -yq \
        nodejs

# Install whispercpp dependencies (Transcription AI service)
RUN apt-get update && apt-get install -y \
    g++

# Install pnpm package
RUN npm install -g pnpm

# Download whispercpp small model for developement
# RUN mkdir -p ./whispercpp/models
# RUN curl -L -o ./whispercpp/models/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

EXPOSE 8080

CMD [ "pnpm", "dev" ]

FROM ubuntu:latest as production

WORKDIR /usr/src/app

# Install ffmpeg globally. FFMPEG is used to process audio to make it compatible with whispercpp
RUN apt-get update && apt-get install -y ffmpeg

# Install OS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN apt-get update -yq \
    && curl -L https://deb.nodesource.com/setup_18.x | bash \
    && apt-get update -yq \
    && apt-get install -yq \
        nodejs

# Install whispercpp dependencies (Transcription AI service)
RUN apt-get update && apt-get install -y \
    g++

# Install pnpm package
RUN npm install -g pnpm

# Download whispercpp large model for production
# RUN mkdir -p ./whispercpp/models
# RUN curl -L -o ./whispercpp/models/ggml-large.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin

COPY package.json pnpm-lock.yaml ./
COPY --from=development /usr/src/app/node_modules ./node_modules

COPY . .

RUN pnpm build

EXPOSE 8080

CMD ["pnpm", "start"]
