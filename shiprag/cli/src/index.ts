#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { deployCommand } from "./commands/deploy.js";
import { loginCommand } from "./commands/login.js";

import { registerCommand } from "./commands/register.js";

const program = new Command();

program
  .name("shiprag")
  .description("Push your docs, get a live RAG API. Git push to deploy, for RAG.")
  .version("0.1.0");

program.command("register <email> <password>").description("Register a new SHIPRAG account").action(registerCommand);
program.command("login [email] [password]").description("Authenticate the CLI").action(loginCommand);
program.command("init").description("Create a shiprag.config.json in this repo").action(initCommand);
program.command("deploy").description("Ingest docs and deploy the RAG service").action(deployCommand);

program.parse();
