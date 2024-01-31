export const PORT = process.env.PORT || 8080;

export const API_LAUNCH_ENV =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';
export const API_IS_PRODUCTION = API_LAUNCH_ENV === 'production';
