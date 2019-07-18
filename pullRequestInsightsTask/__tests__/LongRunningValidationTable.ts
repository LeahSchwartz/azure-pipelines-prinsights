import { AbstractPipeline } from "../AbstractPipeline";
import sinon from "sinon";
import { Release } from "../Release";
import { mock } from "ts-mockito";
import messages from '../user_messages.json';
import { Branch } from "../Branch";
import { AbstractPipelineTaskRun } from "../AbstractPipelineTaskRun";
import { BuildTaskRun } from "../BuildTaskRun";
import { LongRunningValidationsTable } from "../LongRunningValidationsTable";
import { PipelineTask } from "../PipelineTask";

describe("LongRunningValidationTable Tests", () => {

    let longRunTable: LongRunningValidationsTable;

    function makeFakePipeline(name: string, link: string, definitionId: number, definitionName: string): AbstractPipeline {
        let pipeline: AbstractPipeline = mock(Release);
        sinon.stub(pipeline, "getDisplayName").returns(name);
        sinon.stub(pipeline, "getDefinitionName").returns(definitionName);
        sinon.stub(pipeline, "getLink").returns(link);
        sinon.stub((pipeline as Release), "getDefinitionId").returns(definitionId);
        return pipeline;
     }

     function makeFakeBranch(name: string, mostRecent: AbstractPipeline): Branch {
        let branch: Branch = new Branch(name, null);
        sinon.stub(branch, "getTruncatedName").returns(name);
        sinon.stub(branch, "getMostRecentCompletePipeline").returns(mostRecent);
        return branch;
     }

     function makeFakeTask(name: string, duration: number, regression: number): AbstractPipelineTaskRun {
        let task: AbstractPipelineTaskRun = mock(BuildTaskRun); 
        sinon.stub(task, "getName").returns(name);
        sinon.stub(task, "calculateRegression").returns(regression);
        sinon.stub(task, "getDuration").returns(duration);
        return task;
     }

     function makeFakeLongRunningValidation(name: string, numberAgents: number, maxDuration: number, minDuration: number, maxRegression: number, minRegression: number): PipelineTask {
        let validation: PipelineTask = new PipelineTask(name, null, null);
        sinon.stub(validation, "getLongestRegressiveDuration").returns(maxDuration);
        sinon.stub(validation, "getShortestRegressiveDuration").returns(minDuration);
        sinon.stub(validation, "getLongestRegression").returns(maxRegression);
        sinon.stub(validation, "getShortestRegression").returns(minRegression);
        sinon.stub(validation, "getNumberOfAgentsRunOn").returns(numberAgents);
        return validation;
     }

    test("Header is added to empty table",  () => {
       longRunTable = new LongRunningValidationsTable();
       longRunTable.addHeader("master");
       expect(longRunTable.getCurrentCommentData()).toBe("\n" + messages.longRunningValidationCommentTableHeading.format("master") + "\n|---|---|---|<!--longRunningValidationTable-->");
    });

    test("Section is not added to table without header",  () => {
        longRunTable = new LongRunningValidationsTable();
        let current: AbstractPipeline = makeFakePipeline("pipeline", "pipelineLink", 7, "defName");
        let recent: AbstractPipeline = makeFakePipeline("otherPipeline", "otherPipelineLink", 7, undefined);
        longRunTable.addSection(current, "link", makeFakeBranch("branch", recent), 2, [makeFakeLongRunningValidation("abc", 1, 1, 1, 1 ,1)]);
        expect(longRunTable.getCurrentCommentData()).toBe("");
    });

    test.skip("Single validation section is added to table with existing data",  () => {
        longRunTable = new LongRunningValidationsTable(messages.longRunningValidationCommentTableHeading.format("master") + " \n|---|---|---|<!--longRunningValidationTable-->");
        let current: AbstractPipeline = makeFakePipeline("pipeline", "pipelineLink", 7, "defName");
        let recent: AbstractPipeline = makeFakePipeline("otherPipeline", "otherPipelineLink", 7, undefined);
        longRunTable.addSection(current, "link", makeFakeBranch("branch", recent), 2, [makeFakeLongRunningValidation("abc", 1, 100005, 100005, 1000, 1000)]);
        expect(longRunTable.getCurrentCommentData()).toBe(messages.longRunningValidationCommentTableHeading.format("master") + " \n|---|---|---|\n" + 
        messages.longRunningValidationCommentFirstSectionRow.format("defName", "pipelineLink", "abc", messages.durationWithRegressionFormat.format("1m 40s", "1s")) + "<!--longRunningValidationTable-->");
    });

    test.skip("Multi validation section is added to table with existing data",  () => {
        longRunTable = new LongRunningValidationsTable(messages.longRunningValidationCommentTableHeading.format("master") + "\n|---|---|---|<!--longRunningValidationTable-->");
        let current: AbstractPipeline = makeFakePipeline("pipeline", "pipelineLink", 7, "defName");
        let recent: AbstractPipeline = makeFakePipeline("otherPipeline", "otherPipelineLink", 7, undefined);
        longRunTable.addSection(current, "link", makeFakeBranch("branch", recent), 2, [makeFakeLongRunningValidation("abc", 1, 2000, 2000, 1000, 1000), makeFakeLongRunningValidation("xyz", 1, 3000, 3000, 5000, 5000)]);
        expect(longRunTable.getCurrentCommentData()).toBe(messages.longRunningValidationCommentTableHeading.format("master") + "\n|---|---|---|\n" + messages.longRunningValidationCommentFirstSectionRow.format("defName" ,"pipelineLink", "abc", messages.durationWithRegressionFormat.format("2s", "1s")) +"\n" +
        messages.longRunningValidationCommentLowerSectionRow.format("defName", "pipelineLink", "xyz", messages.durationWithRegressionFormat.format("3s", "5s")) + "<!--longRunningValidationTable-->");
    });
});