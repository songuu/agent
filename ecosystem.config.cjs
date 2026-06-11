module.exports = {
  apps: [
    {
      name: "agent-build-runner",
      cwd: __dirname,
      script: "./scripts/demo-runner/run-production.sh",
      interpreter: "bash",
      env: {
        NODE_ENV: "production",
        DEMO_RUNNER_PORT: "5174",
        DEMO_RUNNER_ALLOWED_HOSTS: "songuu.top",
        DEMO_RUNNER_ALLOWED_ORIGINS: "https://songuu.top",
        DEMO_RUNNER_ALLOW_MISSING_ORIGIN: "1",
        DEMO_RUNNER_REQUIRE_TOKEN: "0",
      },
      max_memory_restart: "300M",
    },
  ],
};
