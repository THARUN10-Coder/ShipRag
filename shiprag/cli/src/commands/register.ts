import chalk from "chalk";
import fetch from "node-fetch";

export async function registerCommand(email?: string, password?: string): Promise<void> {
  if (!email || !password) {
    console.log(chalk.red("Usage: shiprag register <email> <password>"));
    process.exitCode = 1;
    return;
  }

  console.log(chalk.blue(`Registering user ${email}...`));
  try {
    const res = await fetch("http://localhost:8080/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log(chalk.red(`Registration failed: ${err}`));
      process.exitCode = 1;
      return;
    }

    const data = await res.json() as any;
    console.log(chalk.green("Account created successfully!"));
    console.log(`User ID: ${data.user.user_id}`);
    console.log(chalk.yellow("Run `shiprag login <email> <password>` to log in."));
  } catch (err: any) {
    console.log(chalk.red(`Network error: ${err.message}`));
    process.exitCode = 1;
  }
}
