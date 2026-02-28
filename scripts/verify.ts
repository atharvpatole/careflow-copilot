import { execSync } from "child_process";

function verify() {
    try {
        console.log("Running full local verification...");
        execSync("npm run data:build", { stdio: "inherit" });
        execSync("npm run data:check", { stdio: "inherit" });
        execSync("npm run lint", { stdio: "inherit" });
        execSync("npm run build", { stdio: "inherit" });
        console.log("OK");
    } catch {
        console.error("Verification failed");
        process.exit(1);
    }
}

verify();
