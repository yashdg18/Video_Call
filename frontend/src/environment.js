let IS_PROD = false;

const server = IS_PROD
  ? "https://video-conferencing-platform-1-xdo8.onrender.com"
  : "http://localhost:8000";

export default server;
