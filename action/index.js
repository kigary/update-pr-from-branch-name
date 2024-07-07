/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 901:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 790:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(901);
const github = __nccwpck_require__(790);

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
            core.setFailed(`Issue ticket container punctuation ${inputs.issueTicketContainerPunctuation} is not allowed.\n
            Allowed values are ${issueTicketContainerPunctuationPossibleValues}`);
            return 1;
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
            core.info(`Branch prefix separator "${inputs.branchPrefixSeparator}" is not found in branch name. Skipping Pull Request update...`);
            return 0;
        }

        if(!inputs.branchPrefix) {
            core.info('Branch prefix is not set. Skipping...');
        } else {
            if (!branchPrefixes.includes(prefix)) {
                core.setFailed(`Branch prefix ${prefix} is not allowed. Allowed prefixes are ${branchPrefixes}`);
                return 1;
            }
        }

        const issueTicketRegex = new RegExp(inputs.issueTicketRegex);
        core.info(`Issue ticket regex: ${issueTicketRegex}`);

        const [_, issueTicketNumber, issueTicketSummary] = issueTicket.split(issueTicketRegex);
        core.info(`Issue ticket number: ${issueTicketNumber}`);

        if(!issueTicketNumber) {
            core.info(`Issue ticket number is not found in branch name. Skipping Pull Request update...`);
            return 0;
        }

        const issueTicketSummaryNormalized = capitalize(issueTicketSummary
          .replace(new RegExp(inputs.issueTicketSeparator, 'gi'), ' ').trim());
        core.info(`Issue ticket summary: ${issueTicketSummaryNormalized}`);

        const issueTicketUrl = `[${issueTicketNumber}](${inputs.issueTrackerUrl
          .replace(/\/$/, '')}/${issueTicketNumber})`;

        core.info(`Issue ticket url: ${issueTicketUrl}`);

        const title = `${issueTicketContainerPunctuation[0] ?? ''} ${issueTicketNumber} ${issueTicketContainerPunctuation[1] ?? ''} ${issueTicketSummaryNormalized}`;
        core.info(`Pull Request title will be changed to: ${title}`);

        const initialBody = github.context.payload.pull_request.body ?? '';
        let body = initialBody;
        const bodyPrefix = `This PR is related to ${issueTicketUrl}`;
        if(body.includes(bodyPrefix)) {
            core.info(`Body already contains ${bodyPrefix}. Skipping...`);
        } else {
            body = `${bodyPrefix}\n\n${initialBody}`;
            core.info(`Pull Request body will be changed to: : ${body}`);
        }

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
            return 1;
        }

        core.setOutput('issue-ticket-number', issueTicketNumber);
        core.setOutput('issue-ticket-url', issueTicketUrl);
        core.setOutput('pull-request-title', request.title);
    } catch (error) {
        core.setFailed(error.message);
        return 1;
    }
}

void run();
})();

module.exports = __webpack_exports__;
/******/ })()
;