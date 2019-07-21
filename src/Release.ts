import * as azureReleaseInterfaces from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import { AbstractPipeline } from "./AbstractPipeline";
import { AbstractPipelineTask } from "./AbstractPipelineTask";
import { AbstractAzureApi } from "./AbstractAzureApi";
import { ReleaseTask } from "./ReleaseTask";
import tl = require('azure-pipelines-task-lib/task');
import { release } from "os";


export class Release extends AbstractPipeline{

    private releaseData: azureReleaseInterfaces.Release;
    private environmentData: azureReleaseInterfaces.ReleaseEnvironment;
    private selectedDeployment: azureReleaseInterfaces.DeploymentAttempt;
    public static readonly COMPLETE_DEPLOYMENT_STATUSES = [azureReleaseInterfaces.DeploymentStatus.PartiallySucceeded, azureReleaseInterfaces.DeploymentStatus.Succeeded, azureReleaseInterfaces.DeploymentStatus.Failed];

    constructor(releaseData: azureReleaseInterfaces.Release) {
        super();
        this.releaseData = releaseData;
        this.environmentData = releaseData.environments[0];
        this.selectedDeployment = this.getSelectedDeployment(this.environmentData.deploySteps);
        this.setTasks(this.parseForTasks());
    }

    private parseForTasks(): AbstractPipelineTask[] {
        let tasks: AbstractPipelineTask[] = [];
        try {
            for (let phase of this.selectedDeployment.releaseDeployPhases){
                for (let job of phase.deploymentJobs){
                    for (let task of job.tasks){
                        tasks.push(new ReleaseTask(task.name, String(task.id), task.startTime, task.finishTime, task.status));
                    }
                }
            }
        }
        catch (err) {
            tl.debug("Warning: Release " + this.getDisplayName() + " is missing task data");
        }
        return tasks;
    }

    private getSelectedDeployment(deploymentAttempts: azureReleaseInterfaces.DeploymentAttempt[]): azureReleaseInterfaces.DeploymentAttempt {
        if (deploymentAttempts && deploymentAttempts.length > 0){
            return deploymentAttempts[0];
        }
        throw(new Error("no deployment attempts available for release with id " + this.getId()));
    }

    public getDefinitionId(): number{
        return Number(this.releaseData.releaseDefinition.id); 
    }

    public getDefinitionName(): string {
        return this.releaseData.releaseDefinition.name;
    }

    public async getDefinitionLink(apiCaller: AbstractAzureApi, project: string): Promise<string> {
        return this.releaseData.releaseDefinition._links.web.href;
    }

    public getEnvironmentDefinitionId(): number{
        return Number(this.environmentData.definitionEnvironmentId);
    }

    public isFailure(): boolean {
        if (this.isComplete()) {
            return this.selectedDeployment.status === azureReleaseInterfaces.DeploymentStatus.Failed;
        }
        return this.taskFailedDuringRun();
    }
    
    public isComplete(): boolean {
        return Release.COMPLETE_DEPLOYMENT_STATUSES.includes(this.getSelectedDeployment(this.environmentData.deploySteps).status);
    }

    public getLink(): string {
        return String(this.releaseData._links.web.href);
    }

    public getId(): number {
        return Number(this.releaseData.id);
    }

    public getDisplayName(): string {
        return this.releaseData.name;
    }
    
   
}


