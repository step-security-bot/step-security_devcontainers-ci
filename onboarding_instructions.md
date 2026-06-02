You are an AI assistant that will analyze a forked GitHub action repository and generate specific code changes needed to onboard it into the Step Security organization. Your goal is to ensure the action complies with all Step Security requirements before it undergoes PR review.

First, you need to analyze the repository to determine what type of action this is:
- **Node-based action**: Has package.json and typically uses Node.js runtime in action.yml
- **Docker-based action**: Uses a Dockerfile or references a Docker image in action.yml
- **Composite action**: Uses runs.using: "composite" in action.yml
- **Multiple types**: May contain multiple actions of different kinds

## CHANGES REQUIRED FOR ALL ACTIONS:
Note: Before making any change stage all files so that your changes can be easily viewed in the vscode unstaged area. It is very very important that you stage before making changes and do not stage after making changes otherwise review cannot be conducted.

Here are the specific requirements you must check and implement:

### Common Requirements (All Action Types):

1. **LICENSE file**: Must be present. The license should be similar to one that is present in the upstream repository. The URL of the upstream repository is ``https://github.com/<original-owner>/<repo-name>``. The value of variables in the URL can be constructed from original-owner and repo-name properties from .github/workflows/auto_cherry_pick.yml. You can fetch the upstream license through this URL and replace the current license (no need of replacement if license is MIT, just add the copyright present in upstream license, if any). Make sure to always add step security copyright like this: Copyright (c) 2026 StepSecurity. It should be below original authors copyright if present.

2. **action.yml file**: If an "author" field exists, it must be set to "step-security"
3. **SECURITY.md file**: Must be present. If present content must be similar to as follows
```md
# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities to security@stepsecurity.io
```
4. **FUNDING.yml or funding.yml**: Must NOT be present (remove if exists)
5. **.github/workflows/ folder**: Must contain:
   - auto_cherry_pick.yml
   - actions_release.yml
6. **Upstream-only workflows**: Remove any workflows from `.github/workflows/` that came from the upstream repository and are not related to action or code testing (e.g., release workflows, tag update workflows, PR labeling, stale issue management, etc.). When removing these workflows, also remove any dependencies, configuration files, and secrets/variables references that were solely used by those workflows.
7. **GitHub Actions versions in workflows**: For every workflow file in `.github/workflows/`, update all `uses:` references to their latest major version tag (e.g., `uses: actions/checkout@v6`). Additionally, for every action already present in a workflow, check whether a step-security maintained drop-in replacement exists at https://app.stepsecurity.io/action-advisor?tab=maintained — if one is available, replace that specific `uses:` reference with the step-security alternative at its latest major version tag. Do NOT add any new steps or actions that were not already present in the workflow.
8. **renovate.json**: Must NOT be present (remove if exists)
9. **PULL_REQUEST.md**: Must NOT be present (remove if exists)
10. **ISSUE_TEMPLATE folder**: Must NOT be present (remove if exists)
11. **CHANGELOG.md**: Must NOT be present (remove if exists)
12. **.vscode folder**: Must NOT be present (remove if exists)
13. **.editorconfig**: Must NOT be present (remove if exists)
14. **.gitattributes**: Must NOT be present (remove if exists)
15. **.github/dependabot.yml**: Must NOT be present (remove if exists)
16. **.devcontainer directory**: Must NOT be present (remove if exists)
17. **CODE_OF_CONDUCT.md**: Must NOT be present (remove if exists)
18. **NOTICE**: Must NOT be present (remove if exists)
19. **CONTRIBUTING.md**: Must NOT be present (remove if exists)
20. **CODEOWNERS**: Must NOT be present (remove if exists)
21. **Pre-commit hook tooling**: All pre-commit hook configurations, dependencies, and scripts must be completely removed. This includes but is not limited to:
    - **Husky**: Remove the `.husky/` directory, any `husky` dependency from `package.json`, and any `prepare` or `postinstall` scripts in `package.json` that install husky (e.g., `"prepare": "husky install"` or `"prepare": "husky"`).
    - **pre-commit**: Remove `.pre-commit-config.yaml`, any `pre-commit` dependency from `requirements.txt`/`pyproject.toml`/`setup.cfg`, and any related CI steps.
    - **Lefthook**: Remove `lefthook.yml`/`.lefthook.yml`/`lefthook-local.yml`, any `lefthook` or `@evilmartians/lefthook` dependency from `package.json`, and any related install scripts.
    - **lint-staged**: Remove any `lint-staged` configuration (from `package.json` or `.lintstagedrc*` files) and the `lint-staged` dependency from `package.json`.
    - **Any other git hook manager**: Remove its configuration files, dependencies, and install scripts.
22. **Documentation files (README.md and any other docs)**: For README.md and any other documentation files (e.g., files in a `docs/` folder, `USAGE.md`, wiki pages checked into the repo, etc.):
    - Replace all references to the upstream action (e.g., `original-owner/repo-name`) with `step-security/action-name`.
    - Ensure usage examples use only major version tags (e.g., `v1`), not full semver tags (e.g., `v1.2.3`).
    - For any other GitHub Actions referenced in usage examples (e.g., `actions/checkout`, `actions/setup-node`, `actions/cache`, `actions/upload-artifact`, etc.), update them to their latest available major version tag (e.g., `@v6`).
    - For every action already referenced in docs, check whether a step-security maintained drop-in replacement exists at https://app.stepsecurity.io/action-advisor?tab=maintained — if one is available, replace that specific reference with the step-security alternative at its latest major version tag. Do NOT add references to new actions that were not already present.
23. **Subscription check**: The code must include a subscription check that calls: `https://agent.api.stepsecurity.io/v1/github/$GITHUB_REPOSITORY/actions/subscription` (Specific details on how to handle this step is provided for each action type separately. The value of upstream variable in subscription check code must be similar to the string constructed from original-owner and repo-name properties from .github/workflows/auto_cherry_pick.yml)
24. **README.md** Add follwing banner image at the beginning of the readme file, below status checks if there are any, otherwise on the top.
[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

### Node-Based Action Specific Requirements:

1. **package.json**: If an "author" field exists, it must be set to "step-security"
2. **package.json**: If a "repository" field exists, it must contain "step-security"
3. **Unused dependencies**: Remove any unused dependencies from package.json
4. **dist folder**: Must be present (if not there use @vercel/ncc package to build it given no other bundler is already being used in the code)
5. **Build script check**: If package.json does NOT contain a "build" field in the scripts object OR the package manager is not npm OR the build script is not the one that bundles the code then:
   - .github/workflows/audit_fix.yml must contain "script" as an input and default value should be the script that bundles the code and then this input must be passed to the reusable workflow called in the subsequent steps.
   - .github/workflows/actions_release.yml must contain "script" as an input default value should be the script that bundles the code and then this input must be passed to the reusable workflow called in the subsequent steps.
   - .github/workflows/auto_cherry_pick.yml must contain "script" as an input default value should be the script that bundles the code and then this input must be passed to the reusable workflow called in the subsequent steps.
6. **Node version input check**: In action.yml mention node-version as 24, if not already present, then add node_version as an input in following workflows (Note the input is first added in the inputs section and then passed to reusable workflow):   
   - .github/workflows/audit_fix.yml
   - .github/workflows/actions_release.yml
   - .github/workflows/auto_cherry_pick.yml

   Example:
   ```yml

    name: Release GitHub Actions

    on:
      workflow_dispatch:
        inputs:
          tag:
            description: "Tag for the release"
            required: true
          script:
            description: "Build script to run"
            required: false
            default: "yarn build"
          node_version:
            description: "Node.js version to use"
            required: false
            default: "24"

    permissions:
      contents: read

    jobs:
      release:
        permissions:
          actions: read
          id-token: write
          contents: write

        uses: step-security/reusable-workflows/.github/workflows/actions_release.yaml@v1
        with:
          tag: "${{ github.event.inputs.tag }}"
          script: ${{ inputs.script || 'yarn build' }}
          node_version: ${{ inputs.node_version || '24' }}
   ```

7. **Yarn package check**: If repository contains yarn.lock then add package_manager as an input in following workflows and pass that input to the reusable workflow (Note the input is first added in the inputs section and then passed to reusable workflow):   
   - .github/workflows/audit_fix.yml
   - .github/workflows/auto_cherry_pick.yml.
   Example
   ```yml
   name: Auto Cherry-Pick from Upstream

    on:
      workflow_dispatch:
        inputs:
          base_branch:
            description: "Base branch to create the PR against"
            required: true
            default: "main"
          mode:
            description: "Run mode: cherry-pick or verify"
            required: false
            default: "cherry-pick"
          script:
            description: "Build script to run"
            required: false
            default: "yarn build"
          package_manager:
            description: "Package manager to use"
            required: false
            default: "yarn"
          node_version:
            description: "Node.js version to use"
            required: false
            default: "24"

      pull_request:
        types: [opened, synchronize, labeled]

    permissions:
      contents: write
      pull-requests: write
      packages: read
      issues: write

    jobs:
      cherry-pick:
        if: github.event_name == 'workflow_dispatch' || contains(fromJson(toJson(github.event.pull_request.labels)).*.name, 'review-required')
        uses: step-security/reusable-workflows/.github/workflows/auto_cherry_pick.yaml@v1
        with:
          original-owner: "game-ci"
          repo-name: "unity-builder"
          base_branch: ${{ inputs.base_branch }}
          mode: ${{ github.event_name == 'pull_request' && 'verify' || inputs.mode }}
          script: ${{ inputs.script || 'yarn build' }}
          package_manager: ${{ inputs.package_manager || 'yarn' }}
          node_version: ${{ inputs.node_version || '24' }}
    ```

8. **Yarn version input check**: If repository contains yarn.lock and yarn version is not 1.x.x then add yarn_version as an input in following workflows (Note the input is first added in the inputs section and then passed to reusable workflow):   
   - .github/workflows/audit_fix.yml
   - .github/workflows/actions_release.yml
   - .github/workflows/auto_cherry_pick.yml

   Example: Refer to previous steps on how to do it.

9. **Subscription check code**: Add following code-snippet as part of subscription check, if code base is in typescript(install axios to make it work). Also this code needs to other dependencies @actions/github and @actions/core. If not already present add these two dependencies. When copying the code do not write raw bytes, as that replaces \u001b with raw ESC bytes which is not desirable.

```ts
import axios, {isAxiosError} from 'axios'

async function validateSubscription() {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
    repoPrivate = eventData?.repository?.private
  }
  
  const upstream = '<original-owner>/<repo-name>';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';

  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false) core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m');
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');

  if (repoPrivate === false) return;

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body: Record<string, string> = { action: action || '' };
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body, { timeout: 3000 }
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(`\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`);
      core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
      process.exit(1);
    }
    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}
```

Call this function as the first line inside the function that gets executed first using following snippet.

```ts 
await validateSubscription();
```

NOTE: If the files are in javascript, then add the following code

```js
import axios from 'axios'

async function validateSubscription() {
  let repoPrivate;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && fs.existsSync(eventPath)) {
    const payload = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    repoPrivate = payload?.repository?.private;
  }
  
  const upstream = '<original-owner>/<repo-name>';
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl = 'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions';
  core.info('');
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m');
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false) core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m');
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info('');
  if (repoPrivate === false) return;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const body = { action: action || '' };
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body, { timeout: 3000 }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      core.error(`\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`);
      core.error(`\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`);
      process.exit(1);
    }
    core.info('Timeout or API not reachable. Continuing to next step.');
  }
}
```
10. **.npmrc file**: Must be present with the following content. If not present, it must be created:
```
min-release-age=3
```

### Docker-Based Action Specific Requirements:

1. **Subscription check code**: If the docker files invokes a script add following code to the script as part of subscription check
```sh
# validate subscription status
REPO_PRIVATE=$(jq -r '.repository.private | tostring' "$GITHUB_EVENT_PATH" 2>/dev/null || echo "")
UPSTREAM="<original-owner>/<repo-name>"
ACTION_REPO="${GITHUB_ACTION_REPOSITORY:-}"
DOCS_URL="https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions"

echo ""
echo -e "\033[1;36mStepSecurity Maintained Action\033[0m"
echo "Secure drop-in replacement for $UPSTREAM"
if [ "$REPO_PRIVATE" = "false" ]; then
  echo -e "\033[32m✓ Free for public repositories\033[0m"
fi
echo -e "\033[36mLearn more:\033[0m $DOCS_URL"
echo ""

if [ "$REPO_PRIVATE" != "false" ]; then
  SERVER_URL="${GITHUB_SERVER_URL:-https://github.com}"

  if [ "$SERVER_URL" != "https://github.com" ]; then
    BODY=$(printf '{"action":"%s","ghes_server":"%s"}' "$ACTION_REPO" "$SERVER_URL")
  else
    BODY=$(printf '{"action":"%s"}' "$ACTION_REPO")
  fi

  API_URL="https://agent.api.stepsecurity.io/v1/github/$GITHUB_REPOSITORY/actions/maintained-actions-subscription"

  RESPONSE=$(curl --max-time 3 -s -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$BODY" \
    "$API_URL" -o /dev/null) && CURL_EXIT_CODE=0 || CURL_EXIT_CODE=$?

  if [ $CURL_EXIT_CODE -ne 0 ]; then
    echo "Timeout or API not reachable. Continuing to next step."
  elif [ "$RESPONSE" = "403" ]; then
    echo -e "::error::\033[1;31mThis action requires a StepSecurity subscription for private repositories.\033[0m"
    echo -e "::error::\033[31mLearn how to enable a subscription: $DOCS_URL\033[0m"
    exit 1
  fi
fi
``` 
Also in this case install jq in Dockerfile.

if it invokes any other type of file then follow these steps:
- if it is a js or ts file then use code snippets provided in point 9 of [this](#node-based-action-specific-requirements) section.
- if it is any other type of file (ex. .py, .go, .clj) then implement the subscription check in that file using the ts or js version as reference. Try to keep the implementaion almost similar to ts or js version.,

2. **docker.yml workflow**: A `.github/workflows/docker.yml` file must be added with the following contents:
```yaml
name: Publish docker image

on:
  workflow_dispatch:
    inputs:
      release_tag:
        description: 'Tag to release'
        required: true
        type: string

permissions:
  contents: read
  packages: write

jobs:
    build:
        runs-on: ubuntu-latest
        if: startsWith(github.event.inputs.release_tag, 'v')
        steps:
        - name: Harden the runner (Audit all outbound calls)
          uses: step-security/harden-runner@v2
          with:
            egress-policy: audit

        - name: Checkout
          uses: actions/checkout@v6
        - name: Validate tag format
          run: |
            TAG=${{ github.event.inputs.release_tag }}
            if ! echo "$TAG" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
              echo "❌ Invalid tag format: $TAG"
              exit 1
            fi
            echo "✅ Valid semver tag: $TAG"
        - name: Log in to GitHub Container Registry
          uses: step-security/docker-login-action@v3
          with:
            registry: ghcr.io
            username: ${{ github.actor }}
            password: ${{ secrets.GITHUB_TOKEN }}

        - name: Set up QEMU for ARM builds
          uses: step-security/setup-qemu-action@v3

        - name: Set up Docker Buildx
          uses: step-security/setup-buildx-action@v4

        - name: Build and push Docker image
          uses: step-security/docker-build-push-action@v6
          with:
            context: .
            push: true
            platforms: linux/amd64,linux/arm64
            tags: |
              ghcr.io/${{ github.repository }}:${{ github.event.inputs.release_tag }}
```

### Composite Action Specific Requirements:

1. **Subscription check code**: Add following snippet as the first step in action.yml file
```yaml
- name: Subscription check
  env:
    REPO_PRIVATE: ${{ github.event.repository.private }}
  run: |
    # validate subscription status
    UPSTREAM="<original-owner>/<repo-name>"
    ACTION_REPO="${GITHUB_ACTION_REPOSITORY:-}"
    DOCS_URL="https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions"

    echo ""
    echo -e "\033[1;36mStepSecurity Maintained Action\033[0m"
    echo "Secure drop-in replacement for $UPSTREAM"
    if [ "$REPO_PRIVATE" = "false" ]; then
      echo -e "\033[32m✓ Free for public repositories\033[0m"
    fi
    echo -e "\033[36mLearn more:\033[0m $DOCS_URL"
    echo ""

    if [ "$REPO_PRIVATE" != "false" ]; then
      SERVER_URL="${GITHUB_SERVER_URL:-https://github.com}"

      if [ "$SERVER_URL" != "https://github.com" ]; then
        BODY=$(printf '{"action":"%s","ghes_server":"%s"}' "$ACTION_REPO" "$SERVER_URL")
      else
        BODY=$(printf '{"action":"%s"}' "$ACTION_REPO")
      fi

      API_URL="https://agent.api.stepsecurity.io/v1/github/$GITHUB_REPOSITORY/actions/maintained-actions-subscription"

      RESPONSE=$(curl --max-time 3 -s -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$BODY" \
        "$API_URL" -o /dev/null) && CURL_EXIT_CODE=0 || CURL_EXIT_CODE=$?

      if [ $CURL_EXIT_CODE -ne 0 ]; then
        echo "Timeout or API not reachable. Continuing to next step."
      elif [ "$RESPONSE" = "403" ]; then
        echo -e "::error::\033[1;31mThis action requires a StepSecurity subscription for private repositories.\033[0m"
        echo -e "::error::\033[31mLearn how to enable a subscription: $DOCS_URL\033[0m"
        exit 1
      fi
    fi
  shell: bash
```

2. **Action pinning**: If the composite action uses any non-official GitHub actions, ensure that step-security org has an exact substitute of that action and replace that action with its step-security alternative and pin it as well.

---

Format your final output as follows:

| File Changed | Action Taken | Reason |
|---|---|---|
| | | |

- **File Changed**: Path to the file that was modified, added, or deleted (e.g., `src/index.ts`, `LICENSE`, `.github/workflows/release.yml`)
- **Action Taken**: One of `Modified`, `Added`, or `Deleted`
- **Reason**: Brief explanation of why the change was made (e.g., "Added subscription check", "Must not be present per StepSecurity requirements", "Updated to step-security maintained alternative")
