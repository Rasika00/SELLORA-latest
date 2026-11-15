import { spawn } from "child_process";

console.log("🚀 Starting SELLORA Backend API Server and Vite Dev Server...");

const server = spawn("npm.cmd", ["run", "server"], {
  stdio: "inherit",
  shell: true,
});

const dev = spawn("npm.cmd", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
});

server.on("error", (err) => {
  console.error("Backend server error:", err);
});

dev.on("error", (err) => {
  console.error("Vite dev server error:", err);
});

const cleanup = () => {
  try {
    server.kill();
  } catch {}
  try {
    dev.kill();
  } catch {}
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
