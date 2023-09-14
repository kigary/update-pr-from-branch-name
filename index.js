const core = require('@actions/core');
const github = require('@actions/github');

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const ISSUE_TICKET_CONTAINER_PUNCTUATION = {
    'none': '',
    'square-brackets': '[]',
    'parentheses': '()',
    'curly-brackets': '{}',
    'angle-brackets': '<>',
    'double-quotes': '""',
    'single-quotes': "''"
}

async function run() {
    try {
        const inputs = {
            token: core.getInput('repo-token'),
            branchPrefix: core.getInput('branch-prefix'),
            branchPrefixSeparator: core.getInput('branch-prefix-separator'),
            issueTrackerUrl: core.getInput('issue-tracker-url'),
            issueTicketRegex: core.getInput('issue-ticket-regex'),
            issueTicketSeparator: core.getInput('issue-ticket-separator'),
            issueTicketContainerPunctuation: core.getInput('issue-ticket-container-punctuation')
        }

        const issueTicketContainerPunctuationPossibleValues = Object.keys(ISSUE_TICKET_CONTAINER_PUNCTUATION);
        if(!issueTicketContainerPunctuationPossibleValues.includes(inputs.issueTicketContainerPunctuation)) {
            core.setFailed(`Issue ticket container punctuation ${inputs.issueTicketContainerPunctuation} is not allowed. Allowed values are ${issueTicketContainerPunctuationPossibleValues}`);
            return;
        }
        const issueTicketContainerPunctuation = ISSUE_TICKET_CONTAINER_PUNCTUATION[inputs.issueTicketContainerPunctuation];

        const baseBranchName = github.context.payload.pull_request.base.ref;
        core.info(`Base branch name: ${baseBranchName}`);

        const headBranchName = github.context.payload.pull_request.head.ref;
        core.info(`Head branch name: ${headBranchName}`);

        const branchPrefixes = inputs.branchPrefix.split(',').filter(Boolean);
        core.info(`Branch prefixes: ${branchPrefixes}`)

        const [prefix, issueTicket] = headBranchName.split(inputs.branchPrefixSeparator);
        if (!issueTicket) {
            core.info(`Issue ticket is not found in branch name`);
            return;
        }
        if(!inputs.branchPrefix) {
            core.info('Branch prefix is not set. Skipping...');
        } else {
            if (!branchPrefixes.includes(prefix)) {
                core.setFailed(`Branch prefix ${prefix} is not allowed. Allowed prefixes are ${branchPrefixes}`);
                return;
            }
        }
        const issueTicketRegex = new RegExp(inputs.issueTicketRegex);
        core.info(`Issue ticket regex: ${issueTicketRegex}`);
        const [_, issueTicketNumber, issueTicketSummary] = issueTicket.split(issueTicketRegex);
        core.info(`Issue ticket number: ${issueTicketNumber}`);
        const issueTicketSummaryNormalized = capitalize(issueTicketSummary
          .replace(new RegExp(inputs.issueTicketSeparator, 'gi'), ' ').trim());
        const issueTicketUrl = `[${issueTicketNumber}](${inputs.issueTrackerUrl
          .replace(/\/$/, '')}/${issueTicketNumber})`;
        core.info(`Issue ticket url: ${issueTicketUrl}`);
        core.info(`Issue ticket summary: ${issueTicketSummaryNormalized}`);

        const title = `${issueTicketContainerPunctuation[0] ?? ''} ${issueTicketNumber} ${issueTicketContainerPunctuation[0] ?? ''} ${issueTicketSummaryNormalized}`;
        core.info(`Title: ${title}`);
        const initialBody = github.context.payload.pull_request.body ?? '';
        const body = `This PR is related to ${issueTicketUrl}\n\n${initialBody}`;
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
        core.setOutput('issue-ticket-number', issueTicketNumber);
    } catch (error) {
        core.setFailed(error.message);
    }
}

void run();