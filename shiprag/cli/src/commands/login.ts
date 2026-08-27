import chalk from "chalk";
import fetch from "node-fetch";
import { saveCredentials } from "../lib/config.js";

export async function loginCommand(email?: string, password?: string): Promise<void> {
  if (!email || !password) {
    console.log(chalk.yellow("Usage: shiprag login <email> <password>"));
    process.exitCode = 1;
    return;
  }

  console.log(chalk.blue(`Authenticating ${email}...`));
  try {
    const res = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log(chalk.red(`Login failed: ${err}`));
      process.exitCode = 1;
      return;
    }

    const data = await res.json() as any;
    saveCredentials({
      token: data.access_token,
      email: data.user.email,
      userId: data.user.user_id,
    });

    console.log(chalk.green(`Successfully logged in as ${data.user.email}`));
  } catch (err: any) {
    console.log(chalk.red(`Network error: ${err.message}`));
    process.exitCode = 1;
  }
}
