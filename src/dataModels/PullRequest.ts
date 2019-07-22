import * as azureGitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import { AbstractAzureApi } from "../dataProviders/AbstractAzureApi.js";
import * as tl from "azure-pipelines-task-lib/task";
import commentProperties from "../resources/service_comment_properties.json";
import { ServiceComment } from "../models/ServiceComment.js";

export class PullRequest {
  private id: number;
  private repository: string;
  private projectName: string;
  private pullRequestData: azureGitInterfaces.GitPullRequest;
  private mostRecentSourceCommitId: string;

  constructor(
    id: number,
    repository: string,
    projectName: string,
    pullRequestData: azureGitInterfaces.GitPullRequest
  ) {
    this.id = id;
    this.repository = repository;
    this.projectName = projectName;
    this.pullRequestData = pullRequestData;
    this.parseDataForMostRecentSourceCommitId();
  }

  public getTargetBranchName(): string {
    return this.pullRequestData.targetRefName;
  }

  public getMostRecentSourceCommitId(): string {
    return this.mostRecentSourceCommitId;
  }

  public async postNewThread(
    apiCaller: AbstractAzureApi,
    commentContent: string,
    postStatus: azureGitInterfaces.CommentThreadStatus
  ): Promise<azureGitInterfaces.GitPullRequestCommentThread> {
    const thread: azureGitInterfaces.CommentThread = {
      comments: [{ content: commentContent }],
      status: postStatus
    };
    thread.properties = {
      [commentProperties.taskPropertyName]: commentProperties.taskPropertyValue,
      [commentProperties.iterationPropertyName]: this.mostRecentSourceCommitId
    };
    return apiCaller.postNewCommentThread(
      thread,
      this.id,
      this.repository,
      this.projectName
    );
  }

  public async editServiceComment(
    apiCaller: AbstractAzureApi,
    serviceComment: ServiceComment
  ): Promise<void> {
    await apiCaller.updateComment(
      { content: serviceComment.getContent() },
      this.id,
      this.repository,
      this.projectName,
      serviceComment.getParentThreadId(),
      serviceComment.getId()
    );
  }

  public async deactivateOldComments(
    apiCaller: AbstractAzureApi,
    serviceComments: azureGitInterfaces.GitPullRequestCommentThread[],
    currentIterationCommentId: number
  ): Promise<void> {
    for (const commentThread of serviceComments) {
      if (
        commentThread.id !== currentIterationCommentId &&
        (commentThread.status ===
          azureGitInterfaces.CommentThreadStatus.Active ||
          commentThread.status === undefined)
      ) {
        tl.debug("comment thread id to be deactivated: " + commentThread.id);
        apiCaller.updateCommentThread(
          { status: azureGitInterfaces.CommentThreadStatus.Closed },
          this.id,
          this.repository,
          this.projectName,
          commentThread.id
        );
      }
    }
  }

  public async deleteOldComments(
    apiCaller: AbstractAzureApi,
    serviceComments: azureGitInterfaces.GitPullRequestCommentThread[],
    currentIterationCommentId: number
  ): Promise<void> {
    for (const commentThread of serviceComments) {
      if (
        commentThread.id !== currentIterationCommentId &&
        commentThread.comments.length === 1
      ) {
        apiCaller.deleteComment(
          this.id,
          this.repository,
          this.projectName,
          commentThread.id,
          commentThread.comments[0].id
        );
      }
    }
  }

  public hasServiceThreadForExistingIteration(
    threads: azureGitInterfaces.GitPullRequestCommentThread[]
  ): boolean {
    return this.getCurrentIterationCommentThread(threads) !== null;
  }

  public makeCurrentIterationComment(
    threads: azureGitInterfaces.GitPullRequestCommentThread[]
  ): ServiceComment {
    const currentIterationCommentThread: azureGitInterfaces.GitPullRequestCommentThread = this.getCurrentIterationCommentThread(
      threads
    );
    if (
      currentIterationCommentThread &&
      currentIterationCommentThread.comments &&
      currentIterationCommentThread.comments[0]
    ) {
      return new ServiceComment(
        currentIterationCommentThread.comments[0],
        currentIterationCommentThread.id
      );
    }
    return new ServiceComment();
  }

  public async getCurrentServiceCommentThreads(
    apiCaller: AbstractAzureApi
  ): Promise<azureGitInterfaces.GitPullRequestCommentThread[]> {
    const commentThreads: azureGitInterfaces.GitPullRequestCommentThread[] = await apiCaller.getCommentThreads(
      this.id,
      this.repository,
      this.projectName
    );
    const serviceThreads: azureGitInterfaces.GitPullRequestCommentThread[] = [];
    for (const commentThread of commentThreads) {
      if (this.threadIsFromService(commentThread)) {
        serviceThreads.push(commentThread);
        tl.debug(
          "the thread: thread id = " + commentThread.id + " is from service"
        );
      }
    }
    return serviceThreads;
  }

  private getCurrentIterationCommentThread(
    threads: azureGitInterfaces.GitPullRequestCommentThread[]
  ): azureGitInterfaces.GitPullRequestCommentThread | null {
    for (const commentThread of threads) {
      if (
        this.threadIsFromService(commentThread) &&
        this.getIterationFromServiceCommentThread(commentThread) ===
          this.mostRecentSourceCommitId
      ) {
        tl.debug(
          "comment thread id of thread of current source commit " +
            this.mostRecentSourceCommitId +
            ": thread id = " +
            commentThread.id
        );
        return commentThread;
      }
    }
    tl.debug(
      "no comment was found for iteration " + this.mostRecentSourceCommitId
    );
    return null;
  }

  private parseDataForMostRecentSourceCommitId(): void {
    this.mostRecentSourceCommitId = null;
    if (
      this.pullRequestData.lastMergeCommit &&
      this.pullRequestData.lastMergeCommit.commitId
    ) {
      this.mostRecentSourceCommitId = this.pullRequestData.lastMergeCommit.commitId;
    }
  }

  private getIterationFromServiceCommentThread(
    thread: azureGitInterfaces.GitPullRequestCommentThread
  ): string {
    if (this.threadHasServiceProperties(thread)) {
      return thread.properties[commentProperties.iterationPropertyName].$value;
    }
    return null;
  }

  private threadIsFromService(
    thread: azureGitInterfaces.GitPullRequestCommentThread
  ): boolean {
    return (
      this.threadHasServiceProperties(thread) && this.threadHasComments(thread)
    );
  }

  private threadHasServiceProperties(
    thread: azureGitInterfaces.GitPullRequestCommentThread
  ): boolean {
    return (
      thread.properties &&
      thread.properties[commentProperties.taskPropertyName] &&
      thread.properties[commentProperties.taskPropertyName].$value ===
        commentProperties.taskPropertyValue &&
      thread.properties[commentProperties.iterationPropertyName]
    );
  }

  private threadHasComments(
    thread: azureGitInterfaces.GitPullRequestCommentThread
  ): boolean {
    return thread.comments.length > 0;
  }
}
