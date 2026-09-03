module.exports = {
  apps: [
    {
      name: "virtual-classroom-api",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
