/** PM2 process file for EC2: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "healthcare-api",
      script: "dist/server.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 5000,
      },
    },
  ],
};
