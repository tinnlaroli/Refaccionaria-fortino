module.exports = {
  apps: [
    {
      name: "refaccionaria-api",
      cwd: "/opt/refaccionaria/api",
      script: "src/index.js",
      node_args: "--max-old-space-size=384",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/refaccionaria/api-error.log",
      out_file: "/var/log/refaccionaria/api-out.log",
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],
};
