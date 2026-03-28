let IS_PROD = false;

const server = IS_PROD
  ? "https://video-call-backend-ksbv.onrender.com"
  : "http://localhost:8000";

export default server;
