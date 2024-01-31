import path from 'path';

export const absolutePath = (relativePath: string) => {
  return normalizePath(path.resolve(process.cwd(), relativePath));
};

const normalizePath = (fullPath: string) => {
  if (process.platform !== 'win32') {
    return fullPath
      .replace(/^\\\\\?\\/, '')
      .replace(/\\/g, '/')
      .replace(/\/\/+/g, '/');
  } else {
    return fullPath;
  }
};
