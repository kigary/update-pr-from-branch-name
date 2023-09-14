const core = require('@actions/core');
const github = require('@actions/github');

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
        core.info(`Prefix: ${prefix}`);
        const jiraTicketRegex = new RegExp(inputs.jiraTicketRegex);
        core.info(`Jira ticket regex: ${jiraTicketRegex}`);
        if(jiraTicket) {
            const [_, jiraTicketNumber, jiraTicketSummary] = jiraTicket.split(jiraTicketRegex);
            core.info(`Jira ticket number: ${jiraTicketNumber}`);
            core.info(`Jira ticket summary: ${jiraTicketSummary}`);
            const jiraTicketSummaryNormalized = jiraTicketSummary.replace(new RegExp(inputs.jiraTicketSeparator), ' ').toLowerCase();
            const jiraTicketUrl = `[${jiraTicketNumber}](https://betconstruct.atlassian.net/browse/${jiraTicketNumber})`;
            core.info(`Jira ticket url: ${jiraTicketUrl}`);
            core.info(`Jira ticket summary normalized: ${jiraTicketSummaryNormalized}`);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

void run();