import * as actions_exec from '@actions/exec';
import {ExecOptions, ExecResult} from '../../common/src/exec';

function assertSafeCommand(command: string): void {
	if (!command || command.trim().length === 0) {
		throw new Error('Command must be a non-empty string.');
	}
	// Prevent control characters and shell metacharacters from altering command semantics.
	// This allows normal executable names/paths (including spaces) while rejecting risky forms.
	if (/[\0\r\n|&;<>\x60]/.test(command)) {
		throw new Error(`Unsafe command value rejected: '${command}'.`);
	}
}

export async function exec(
	command: string,
	args: string[],
	options: ExecOptions,
): Promise<ExecResult> {
	assertSafeCommand(command);
	const actionOptions: actions_exec.ExecOptions = {
		ignoreReturnCode: true,
		silent: options.silent ?? false,
	};
	const result = await actions_exec.getExecOutput(command, args, actionOptions);

	return {
		exitCode: result.exitCode,
		stdout: result.stdout,
		stderr: result.stderr,
	};
}
