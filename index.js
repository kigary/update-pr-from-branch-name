const core = require('@actions/core');
const github = require('@actions/github');

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

async function run() {
    try {
        const inputs = {
            token: core.getInput('repo-token'),
            branchPrefix: core.getInput('branch-prefix'),
            branchPrefixSeparator: core.getInput('branch-prefix-separator'),
            jiraTicketRegex: core.getInput('jira-ticket-regex'),
            jiraTicketSeparator: core.getInput('jira-ticket-separator')
        }

        const baseBranchName = github.context.payload.pull_request.base.ref;
        core.info(`Base branch name: ${baseBranchName}`);

        const headBranchName = github.context.payload.pull_request.head.ref;
        core.info(`Head branch name: ${headBranchName}`);

        const branchPrefixes = inputs.branchPrefix.split(',').filter(Boolean);
        core.info(`Branch prefixes: ${branchPrefixes}`)

        const [prefix, jiraTicket] = headBranchName.split(inputs.branchPrefixSeparator);
        if(!branchPrefixes.includes(prefix)) {
            core.setFailed(`Branch prefix ${prefix} is not allowed. Allowed prefixes are ${branchPrefixes}`);
            return;
        }
        core.info(`Prefix: ${prefix}`);
        const jiraTicketRegex = new RegExp(inputs.jiraTicketRegex);
        core.info(`Jira ticket regex: ${jiraTicketRegex}`);
        if (!jiraTicket) {
            core.info(`Jira ticket is not found in branch name`);
            return;
        }
        const [_, jiraTicketNumber, jiraTicketSummary] = jiraTicket.split(jiraTicketRegex);
        core.info(`Jira ticket number: ${jiraTicketNumber}`);
        core.info(`Jira ticket summary: ${jiraTicketSummary}`);
        const jiraTicketSummaryNormalized = capitalize(jiraTicketSummary
          .replace(new RegExp(inputs.jiraTicketSeparator, 'gi'), ' ').trim());
        const jiraTicketUrl = `[${jiraTicketNumber}](https://betconstruct.atlassian.net/browse/${jiraTicketNumber})`;
        core.info(`Jira ticket url: ${jiraTicketUrl}`);
        core.info(`Jira ticket summary normalized: ${jiraTicketSummaryNormalized}`);

        const title = `[${jiraTicketNumber}] ${jiraTicketSummaryNormalized}`;
        core.info(`Title: ${title}`);
        const initialBody = github.context.payload.pull_request.body ?? '';
        const body = `This PR is related to ${jiraTicketUrl}\n\n${initialBody}`;
        core.info(`Body: ${body}`);

        const request = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: github.context.payload.pull_request.number,
            title,
            body
        }

        const octokit = github.getOctokit(inputs.token);
        const response = await octokit.rest.pulls.update(request);

        core.info(`Response: ${response.status}`);
        if (response.status !== 200) {
            core.error('Updating the pull request has been failed');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

void run();