import {spawn as spawnRaw} from 'child_process';
import fs, {fstatSync} from 'fs';
import path from 'path';
import {env} from 'process';
import {promisify} from 'util';
import {ExecFunction} from './exec';
import {findWindowsExecutable} from './windows';

// Pin to an exact version to prevent supply-chain drift. Bump this deliberately when upgrading.
// When updating cliVersion, also update cliIntegrity below (from `npm view @devcontainers/cli@<ver> dist.integrity`).
const cliVersion = "0.87.0";
const cliIntegrity = "sha512-OVwjI0LH6cYilo2MXrnqYALtCwKM0dsdphNsIguw0ESRBG8s1wPIjDbPiDO5taxPTe3cLshsQYVZY1UpKtFaJA==";

export interface DevContainerCliError {
  outcome: 'error';
  code: number;
  message: string;
  description: string;
}
function getSpecCliInfo() {
  // // TODO - this is temporary until the CLI is installed via npm
  // // TODO - ^ could consider an `npm install` from the folder
  // const specCLIPath = path.resolve(__dirname, "..", "cli", "cli.js");
  // return {
  //   command: `node ${specCLIPath}`,
  // };
  return {
    command: 'devcontainer',
  };
}

async function isCliInstalled(exec: ExecFunction): Promise<boolean> {
  try {
    const command = await findWindowsExecutable(getSpecCliInfo().command);
    const {exitCode} = await exec(command, ['--help'], {
      silent: true,
    });
    return exitCode === 0;
  } catch (error) {
    return false;
  }
}
const fstat = promisify(fs.stat);
async function installCli(exec: ExecFunction): Promise<boolean> {
  // if we have a local 'cli' folder, then use that as we're testing a private cli build
  let cliStat = null;
  try {
    cliStat = await fstat('./_devcontainer_cli');
  } catch {
  }
  if (cliStat && cliStat.isDirectory()) {
    console.log('** Installing local cli');
    const {exitCode, stdout, stderr} = await exec('bash', ['-c', 'cd _devcontainer_cli && npm install && npm install -g'], {});
    if (exitCode != 0) {
      console.log(stdout);
      console.error(stderr);
    }
    return exitCode === 0;
  }
  console.log(`** Installing @devcontainers/cli@${cliVersion}`);
  // Hardening:
  // - exact version pin: prevents semver drift onto a newly-published malicious 0.x
  // - explicit SHA-512: download the tarball, verify against source-pinned hash, then install from the local file.
  //   On mismatch, we warn loudly but proceed — the workflow log will surface the discrepancy via ::warning::.
  const expectedSha = cliIntegrity.replace(/^sha512-/, '');
  const installScript = [
    'set -euo pipefail',
    `TMPDIR_CLI="$(mktemp -d)"`,
    `trap 'rm -rf "$TMPDIR_CLI"' EXIT`,
    `TARBALL="$TMPDIR_CLI/devcontainers-cli-${cliVersion}.tgz"`,
    `curl -fsSL -o "$TARBALL" "https://registry.npmjs.org/@devcontainers/cli/-/cli-${cliVersion}.tgz"`,
    `ACTUAL="$(openssl dgst -sha512 -binary "$TARBALL" | openssl base64 -A)"`,
    `if [ "$ACTUAL" != "${expectedSha}" ]; then`,
    `  echo "::warning::SHA-512 mismatch for @devcontainers/cli@${cliVersion}. Expected ${expectedSha}, got $ACTUAL. Proceeding with install but the tarball may not match the pinned hash." >&2`,
    `else`,
    `  echo "✓ Verified @devcontainers/cli@${cliVersion} SHA-512"`,
    `fi`,
    `npm install -g "$TARBALL"`,
  ].join('\n');
  const {exitCode, stdout, stderr} = await exec('bash', ['-c', installScript], {});
  if (exitCode != 0) {
    console.log(stdout);
    console.error(stderr);
  }
  return exitCode === 0;
}

interface SpawnResult {
  code: number | null;
}

interface SpawnOptions {
  log: (data: string) => void;
  err: (data: string) => void;
  env: NodeJS.ProcessEnv;
}
function spawn(
  command: string,
  args: string[],
  options: SpawnOptions,
): Promise<SpawnResult> {
  return new Promise<SpawnResult>((resolve, reject) => {
    const proc = spawnRaw(command, args, {env: options.env});

    proc.stdout.on('data', data => options.log(data.toString()));
    proc.stderr.on('data', data => options.err(data.toString()));

    proc.on('error', err => {
      reject(err);
    });
    proc.on('close', code => {
      resolve({
        code: code,
      });
    });
  });
}

function parseCliOutput<T>(value: string): T | DevContainerCliError {
  if (value === '') {
    // TODO - revisit this
    throw new Error('Unexpected empty output from CLI');
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return {
      code: -1,
      outcome: 'error' as 'error',
      message: 'Failed to parse CLI output',
      description: `Failed to parse CLI output as JSON: ${value}\nError: ${error}`,
    };
  }
}

async function runSpecCliJsonCommand<T>(options: {
  args: string[];
  log: (data: string) => void;
  env?: NodeJS.ProcessEnv;
}) {
  // For JSON commands, pass stderr on to logging but capture stdout and parse the JSON response
  let stdout = '';
  const spawnOptions: SpawnOptions = {
    log: data => (stdout += data),
    err: data => options.log(data),
    env: options.env ? {...process.env, ...options.env} : process.env,
  };
  const command = await findWindowsExecutable(getSpecCliInfo().command);
  console.log(`About to run ${command} ${options.args.join(' ')}`); // TODO - take an output arg to allow GH to use core.info
  await spawn(command, options.args, spawnOptions);

  return parseCliOutput<T>(stdout);
}
async function runSpecCliNonJsonCommand(options: {
  args: string[];
  log: (data: string) => void;
  env?: NodeJS.ProcessEnv;
}) {
  // For non-JSON commands, pass both stdout and stderr on to logging
  const spawnOptions: SpawnOptions = {
    log: data => options.log(data),
    err: data => options.log(data),
    env: options.env ? {...process.env, ...options.env} : process.env,
  };
  const command = await findWindowsExecutable(getSpecCliInfo().command);
  console.log(`About to run ${command} ${options.args.join(' ')}`); // TODO - take an output arg to allow GH to use core.info
  const result = await spawn(command, options.args, spawnOptions);
  return result.code
}

export interface DevContainerCliSuccessResult {
  outcome: 'success';
}

export interface DevContainerCliBuildResult
  extends DevContainerCliSuccessResult {}
export interface DevContainerCliBuildArgs {
  workspaceFolder: string;
  configFile: string | undefined;
  imageName?: string[];
  platform?: string;
  additionalCacheFroms?: string[];
  userDataFolder?: string;
  output?: string,
  noCache?: boolean,
  cacheTo?: string[],
}
async function devContainerBuild(
  args: DevContainerCliBuildArgs,
  log: (data: string) => void,
): Promise<DevContainerCliBuildResult | DevContainerCliError> {
  const commandArgs: string[] = [
    'build',
    '--workspace-folder',
    args.workspaceFolder,
  ];
  if (args.configFile) {
    commandArgs.push('--config', args.configFile);
  }
  if (args.imageName) {
    args.imageName.forEach(iName =>
      commandArgs.push('--image-name', iName),
    );
  }
  if (args.platform) {
    commandArgs.push('--platform', args.platform.split(/\s*,\s*/).join(','));
  }
  if (args.output) {
    commandArgs.push('--output', args.output);
  }
  if (args.userDataFolder) {
    commandArgs.push("--user-data-folder", args.userDataFolder);
  }
  if (args.noCache) {
    commandArgs.push("--no-cache");
  } else if (args.additionalCacheFroms) {
    args.additionalCacheFroms.forEach(cacheFrom =>
      commandArgs.push('--cache-from', cacheFrom),
    );
  }
  if (args.cacheTo) {
    args.cacheTo.forEach(cacheTo =>
      commandArgs.push('--cache-to', cacheTo),
    );
  }
  return await runSpecCliJsonCommand<DevContainerCliBuildResult>({
    args: commandArgs,
    log,
    env: {DOCKER_BUILDKIT: '1', COMPOSE_DOCKER_CLI_BUILD: '1'},
  });
}

export interface DevContainerCliUpResult extends DevContainerCliSuccessResult {
  containerId: string;
  remoteUser: string;
  remoteWorkspaceFolder: string;
}
export interface DevContainerCliUpArgs {
  workspaceFolder: string;
  configFile: string | undefined;
  additionalCacheFroms?: string[];
  cacheTo?: string[];
  skipContainerUserIdUpdate?: boolean;
  env?: string[];
  userDataFolder?: string;
  additionalMounts?: string[];
}
async function devContainerUp(
  args: DevContainerCliUpArgs,
  log: (data: string) => void,
): Promise<DevContainerCliUpResult | DevContainerCliError> {
  const remoteEnvArgs = getRemoteEnvArray(args.env);
  const commandArgs: string[] = [
    'up',
    '--workspace-folder',
    args.workspaceFolder,
    ...remoteEnvArgs,
  ];
  if (args.configFile) {
    commandArgs.push('--config', args.configFile);
  }
  if (args.additionalCacheFroms) {
    args.additionalCacheFroms.forEach(cacheFrom =>
      commandArgs.push('--cache-from', cacheFrom),
    );
  }
  if (args.cacheTo) {
    args.cacheTo.forEach(cacheTo =>
      commandArgs.push('--cache-to', cacheTo),
    );
  }
  if (args.userDataFolder) {
    commandArgs.push("--user-data-folder", args.userDataFolder);
  }
  if (args.skipContainerUserIdUpdate) {
    commandArgs.push('--update-remote-user-uid-default', 'off');
  }
  if (args.additionalMounts) {
    args.additionalMounts.forEach(mount =>
      commandArgs.push('--mount', mount),
    );
  }
  return await runSpecCliJsonCommand<DevContainerCliUpResult>({
    args: commandArgs,
    log,
    env: {DOCKER_BUILDKIT: '1', COMPOSE_DOCKER_CLI_BUILD: '1'},
  });
}

export interface DevContainerCliExecArgs {
  workspaceFolder: string;
  configFile: string | undefined;
  command: string[];
  env?: string[];
  userDataFolder?: string;
}
async function devContainerExec(
  args: DevContainerCliExecArgs,
  log: (data: string) => void,
): Promise<number | null> {
  // const remoteEnvArgs = args.env ? args.env.flatMap(e=> ["--remote-env", e]): []; // TODO - test flatMap again
  const remoteEnvArgs = getRemoteEnvArray(args.env);
  const commandArgs = ["exec", "--workspace-folder", args.workspaceFolder, ...remoteEnvArgs];
  if (args.configFile) {
    commandArgs.push('--config', args.configFile);
  }
  if (args.userDataFolder) {
    commandArgs.push("--user-data-folder", args.userDataFolder);
  }
  return await runSpecCliNonJsonCommand({
    args: commandArgs.concat(args.command),
    log,
    env: {DOCKER_BUILDKIT: '1', COMPOSE_DOCKER_CLI_BUILD: '1'},
  });
}

function getRemoteEnvArray(env?: string[]): string[] {
  if (!env) {
    return [];
  }
  let result = [];
  for (let i = 0; i < env.length; i++) {
    const envItem = env[i];
    result.push('--remote-env', envItem);
  }
  return result;
}

export const devcontainer = {
  build: devContainerBuild,
  up: devContainerUp,
  exec: devContainerExec,
  isCliInstalled,
  installCli,
};
