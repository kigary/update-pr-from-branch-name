const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
    try {
        const baseBranchName = github.context.payload.pull_request.base.ref;
        core.info(`Base branch name: ${baseBranchName}`);
        const headBranchName = github.context.payload.pull_request.head.ref;
        core.info(`Head branch name: ${headBranchName}`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

void run();