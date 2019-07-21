import { PipelineData } from "./PipelineData";
import { AzureApiFactory } from "./AzureApiFactory";
import { Branch } from "./Branch";
import { AbstractAzureApi } from "./AbstractAzureApi";
import { PullRequest } from "./PullRequest";
import * as tl from "azure-pipelines-task-lib/task";
import {
  GitPullRequestCommentThread,
  CommentThreadStatus
} from "azure-devops-node-api/interfaces/GitInterfaces";
import { Table } from "./Table";
import { AbstractPipeline } from "./AbstractPipeline";
import { AbstractPipelineTask } from "./AbstractPipelineTask";
import { TableFactory } from "./TableFactory";

export class TaskInsights {
  public async invoke(data: PipelineData): Promise<void> {
    const percentile: number = 1;
    const numberBuildsToQuery: number = 10;
    const numberPipelinesToConsiderForHealth = 3;

    const azureApiFactory: AzureApiFactory = new AzureApiFactory();
    const azureApi = await azureApiFactory.create(data);
    const pullRequest: PullRequest = await azureApi.getPullRequest(
      data.getRepository(),
      data.getPullRequestId(),
      data.getProjectName()
    );

    if (
      pullRequest.mostRecentSourceCommitMatchesCurrent(
        data.getCurrentSourceCommitIteration()
      )
    ) {
      const currentPipeline: AbstractPipeline = await azureApi.getCurrentPipeline(
        data
      );
      tl.debug(
        "target branch of pull request: " + pullRequest.getTargetBranchName()
      );
      const retrievedPipelines: AbstractPipeline[] = await azureApi.getMostRecentPipelinesOfCurrentType(
        data.getProjectName(),
        currentPipeline,
        numberBuildsToQuery,
        pullRequest.getTargetBranchName()
      );
      tl.debug(
        "Number of retrieved pipelines for " +
          pullRequest.getTargetBranchName() +
          " = " +
          retrievedPipelines.length
      );
      const targetBranch: Branch = new Branch(
        pullRequest.getTargetBranchName(),
        retrievedPipelines
      );
      const thresholdTimes: number[] = [];
      const longRunningValidations: AbstractPipelineTask[] = [];
      let tableType: string = TableFactory.FAILURE;
      tl.debug("pipeline is a failure?: " + currentPipeline.isFailure());
      tl.debug("host type: " + data.getHostType());

      if (!currentPipeline.isFailure()) {
        tableType = TableFactory.LONG_RUNNING_VALIDATIONS;
        for (const task of currentPipeline.getTasks()) {
          const percentileTime: number = targetBranch.getPercentileTimeForPipelineTask(
            percentile,
            task
          );
          if (task.isLongRunning(percentileTime)) {
            longRunningValidations.push(task);
            thresholdTimes.push(percentileTime);
          }
        }
        tl.debug(
          "Number of longRunningValidations = " + longRunningValidations.length
        );
      }

      if (currentPipeline.isFailure() || longRunningValidations.length > 0) {
        const serviceThreads: GitPullRequestCommentThread[] = await pullRequest.getCurrentServiceCommentThreads(
          azureApi
        );
        const currentIterationCommentThread: GitPullRequestCommentThread = pullRequest.getCurrentIterationCommentThread(
          serviceThreads
        );
        const checkStatusLink: string = await this.getStatusLink(
          currentPipeline,
          azureApi,
          data.getProjectName()
        );
        tl.debug(`Check status link to use: ${checkStatusLink}`);
        tl.debug("type of table to create: " + tableType);
        const table: Table = TableFactory.create(
          tableType,
          pullRequest.getCurrentIterationCommentContent(
            currentIterationCommentThread
          )
        );
        tl.debug("comment data: " + table.getCurrentCommentData());
        table.addHeader(targetBranch.getTruncatedName(), percentile);
        table.addSection(
          currentPipeline,
          checkStatusLink,
          targetBranch,
          numberPipelinesToConsiderForHealth,
          longRunningValidations,
          thresholdTimes
        );
        if (currentIterationCommentThread) {
          pullRequest.editCommentInThread(
            azureApi,
            currentIterationCommentThread,
            currentIterationCommentThread.comments[0].id,
            table.getCurrentCommentData()
          );
        } else {
          const currentIterationCommentThreadId: number = (await pullRequest.addNewComment(
            azureApi,
            table.getCurrentCommentData(),
            CommentThreadStatus.Closed
          )).id;
          pullRequest.deleteOldComments(
            azureApi,
            serviceThreads,
            currentIterationCommentThreadId
          );
        }
      }
    }
  }

  private async getStatusLink(
    currentPipeline: AbstractPipeline,
    apiCaller: AbstractAzureApi,
    project: string
  ): Promise<string> {
    let statusLink: string = tl.getInput("checkStatusLink", false);
    if (!statusLink) {
      statusLink = await currentPipeline.getDefinitionLink(apiCaller, project);
    }
    return statusLink;
  }
}
