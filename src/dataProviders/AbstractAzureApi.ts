import * as tl from "azure-pipelines-task-lib/task";
import * as azureGitInterfaces from "azure-devops-node-api/interfaces/GitInterfaces";
import {
  WebApi,
  getPersonalAccessTokenHandler
} from "azure-devops-node-api/WebApi";
import { AbstractPipeline } from "../dataModels/AbstractPipeline";
import { PipelineData } from "../../src/config/PipelineData";
import { PullRequest } from "../dataModels/PullRequest";

export abstract class AbstractAzureApi {
  private connection: WebApi;

  constructor(uri: string, accessKey: string) {
    this.connection = this.createConnection(uri, accessKey);
  }

  /**
   * Fetches current pipeline which task is running in, either build or release depending on AzureApi subclass
   * @param data Object containing variables set by environment and task configurations
   */
  public abstract async getCurrentPipeline(
    data: PipelineData
  ): Promise<AbstractPipeline>;

  /**
   * Fetches certain number of most recent pipelines on current branch, either build or release depending on AzureApi subclass
   * @param project Name of project from which to fetch pipelines
   * @param currentPipeline Pipeline task is currently running within
   * @param maxNumber Maximum number of pipelines to return
   * @param branchName Name of branch pipelines are running on
   */
  public abstract async getMostRecentPipelinesOfCurrentType(
    project: string,
    currentPipeline: AbstractPipeline,
    maxNumber: number,
    branchName: string
  ): Promise<AbstractPipeline[]>;

  /**
   * Fetches pipeline definition data
   * @param project Name of project from which to fetch pipelines
   * @param definitionId Id of definition to fetch
   */
  public abstract async getDefinition(
    project: string,
    definitionId: number
  ): Promise<any>;

  /**
   * Gets webApi to use to fetch other apis
   */
  protected getConnection(): WebApi {
    return this.connection;
  }

  /**
   * Posts a new comment thread on a pull request
   * @param thread Comment thread to post
   * @param pullRequestId Id of pull request on which to post thread
   * @param repositoryId Id of repository pull request is in
   * @param projectName Name of project repostiory and pull request are in
   */
  public async postNewCommentThread(
    thread: azureGitInterfaces.GitPullRequestCommentThread,
    pullRequestId: number,
    repositoryId: string,
    projectName: string
  ): Promise<azureGitInterfaces.GitPullRequestCommentThread> {
    return await (await this.getConnection().getGitApi()).createThread(
      thread,
      repositoryId,
      pullRequestId,
      projectName
    );
  }

  /**
   * Gets all comment threads from a pull request page
   * @param pullRequestId Id of pull request from which to get threads
   * @param repositoryId Id of repository pull request is in
   * @param projectName Name of project repostiory and pull request are in
   */
  public async getCommentThreads(
    pullRequestId: number,
    repositoryId: string,
    projectName: string
  ): Promise<azureGitInterfaces.GitPullRequestCommentThread[]> {
    return (await this.getConnection().getGitApi()).getThreads(
      repositoryId,
      pullRequestId,
      projectName
    );
  }

  /**
   * Updates comment thread on pull request page
   * @param thread Updated comment thread
   * @param pullRequestId Id of pull request that thread is on
   * @param repositoryId Id of repository pull request is in
   * @param projectName Name of project repostiory and pull request are in
   * @param threadId Id of thread being updated
   */
  public async updateCommentThread(
    thread: azureGitInterfaces.GitPullRequestCommentThread,
    pullRequestId: number,
    repositoryId: string,
    projectName: string,
    threadId: number
  ): Promise<azureGitInterfaces.GitPullRequestCommentThread> {
    return (await this.getConnection().getGitApi()).updateThread(
      thread,
      repositoryId,
      pullRequestId,
      threadId,
      projectName
    );
  }

  /**
   * Updates single comment in a thread on a pull request page
   * @param comment Updated comment
   * @param pullRequestId Id of pull request that thread containing comment is on
   * @param repositoryId Id of repository pull request is in
   * @param projectName Name of project repostiory and pull request are in
   * @param threadId Id of thread containing comment
   * @param commentId Id of comment being updated
   */
  public async updateComment(
    comment: azureGitInterfaces.Comment,
    pullRequestId: number,
    repositoryId: string,
    projectName: string,
    threadId: number,
    commentId: number
  ): Promise<azureGitInterfaces.Comment> {
    return (await this.getConnection().getGitApi()).updateComment(
      comment,
      repositoryId,
      pullRequestId,
      threadId,
      commentId,
      projectName
    );
  }

  /**
   * Deletes single comment in a thread on a pull request page
   * @param pullRequestId Id of pull request that thread containing comment is on
   * @param repositoryId Id of repository pull request is in
   * @param projectName Name of project repostiory and pull request are in
   * @param threadId Id of thread containing comment
   * @param commentId Id of comment being deleted
   */
  public async deleteComment(
    pullRequestId: number,
    repositoryId: string,
    projectName: string,
    threadId: number,
    commentId: number
  ): Promise<void> {
    (await this.getConnection().getGitApi()).deleteComment(
      repositoryId,
      pullRequestId,
      threadId,
      commentId,
      projectName
    );
  }

  /**
   * Fetches single comment in a thread on a pull request page
   * @param pullRequestId Id of pull request that thread containing comment is on
   * @param repositoryId Id of repository pull request is in
   * @param projectName Name of project repostiory and pull request are in
   * @param threadId Id of thread containing comment
   * @param commentId Id of comment being retrieved
   */
  public async getComment(
    pullRequestId: number,
    repositoryId: string,
    projectName: string,
    threadId: number,
    commentId: number
  ): Promise<azureGitInterfaces.Comment> {
    return (await this.getConnection().getGitApi()).getComment(
      repositoryId,
      pullRequestId,
      threadId,
      commentId,
      projectName
    );
  }

  /**
   * Gets data on an AzureDevOps pull request
   * @param repositoryId Id of repository pull request is in
   * @param pullRequestId Id of pull request to get
   * @param projectName Name of project repostiory and pull request are in
   */
  public async getPullRequest(
    repositoryId: string,
    pullRequestId: number,
    projectName: string
  ): Promise<PullRequest> {
    return new PullRequest(
      pullRequestId,
      repositoryId,
      projectName,
      await (await this.getConnection().getGitApi()).getPullRequest(
        repositoryId,
        pullRequestId,
        projectName
      )
    );
  }

  /**
   * Gets Web Api to allow fetching of other Api callers, such as Git Api and Build Api
   * @param uri Default URL
   * @param accessToken token to get credentials with access to Api calls
   */
  private createConnection(uri: string, accessToken: string): WebApi {
    const creds = getPersonalAccessTokenHandler(accessToken);
    return new WebApi(uri, creds);
  }
}
