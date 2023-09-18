# Update Pull Request from Branch Name

## Overview

The **Update Pull Request from Branch Name** GitHub Action is designed to automatically update the title and body of a pull request (PR) based on the branch name. This action is especially useful when working with PRs that follow a specific naming convention, containing an issue ticket number and a summary.

**Author**: kigary

### Features

- Automatically updates the PR title and body based on the branch name.
- Supports custom branch prefixes.
- Configurable issue ticket regex for matching issue ticket numbers.
- Customizable issue ticket separator.
- Allows choosing different types of punctuation for wrapping the issue ticket in the PR title.

## Inputs

This action requires the following inputs:

- `repo-token` (required): The `GITHUB_TOKEN` secret for making GitHub API requests. It should have write access to the repository.
- `branch-prefix` (optional): The prefix of the branch name. You can pass a comma-separated list to match multiple prefixes. Leave it empty to match all branches.
- `branch-prefix-separator` (optional): The separator used between the branch prefix and the Jira ticket. Default is `'/'`.
- `issue-tracker-url` (required): The URL of the issue tracker where issue ticket links will point to.
- `issue-ticket-regex` (optional): A regular expression to match and extract the issue ticket number from the branch name. Default is `'([A-Z]+-\\d+)'`.
- `issue-ticket-separator` (optional): The separator used between the issue ticket number and the issue ticket summary. Default is `'-'`.
- `issue-ticket-container-punctuation` (optional): The punctuation style to wrap the issue ticket in the PR title. Possible values are `'none'`, `'square-brackets'`, `'parentheses'`, `'curly-brackets'`, `'angle-brackets'`, `'double-quotes'`, `'single-quotes'`. Default is `'square-brackets'`.

## Outputs

This action sets the following outputs that can be used in subsequent workflow steps:

- `issue-ticket-number`: The extracted issue ticket number from the branch name.
- `issue-ticket-url`: The URL to the issue ticket in the issue tracker.
- `pull-request-title`: The updated PR title.

## Usage

To use this GitHub Action in your workflow, create a YAML file (e.g., `.github/workflows/update_pr.yml`) in your repository with the following configuration:

```yaml
name: Update PR Title

on:
  pull_request:
    types:
      - opened

jobs:
  update_pr_title:
    runs-on: ubuntu-latest

    steps:
      - name: Check out code
        uses: actions/checkout@v2

      - name: Update PR Title
        id: update_title
        uses: kigary/update-pull-request-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          branch-prefix: feat,bugfix
          branch-prefix-separator: _
          issue-tracker-url: https://example.com/issues
          issue-ticket-regex: '[0-9]+'
          issue-ticket-separator: -
          issue-ticket-container-punctuation: square-brackets

      - name: Get PR Title
        run: echo "Updated PR Title: ${{ steps.update_title.outputs.pull-request-title }}"
```

In this example, the action will trigger when a pull request is opened. Customize the inputs to match your repository's naming conventions and requirements.

## Behavior

1. The action checks if the provided `branch-prefix` matches the prefix in the branch name. If not, it fails the workflow.
2. It extracts the issue ticket number from the branch name using the specified `issue-ticket-regex` and `issue-ticket-separator`.
3. It normalizes the issue ticket summary by capitalizing the first letter and replacing separators with spaces.
4. The issue ticket URL is constructed using the `issue-tracker-url` and issue ticket number.
5. The PR title is updated with the issue ticket number enclosed in the specified container punctuation and the normalized summary.
6. The action appends the issue ticket URL to the PR body.
7. If the PR update is successful, relevant outputs are set for use in subsequent steps.

## Conclusion

The **Update Pull Request from Branch Name** GitHub Action helps maintain consistency and traceability in your repository by automatically updating PR titles and bodies based on branch names. Customize the action's inputs to fit your project's naming conventions and requirements.
