import { Table, FailureTable, LongRunningValidationsTable } from "../Table";
import { AbstractPipeline } from "../AbstractPipeline";
import sinon from "sinon";
import { Release } from "../Release";
import { mock } from "ts-mockito";
import messages from '../user_messages.json';
import { Branch } from "../branch";
import { AbstractPipelineTask } from "../AbstractPipelineTask";
import { BuildTask } from "../BuildTask";

describe("LongRunningValidationTable Tests", () => {

    let longRunTable: LongRunningValidationsTable;

    function makeFakePipeline(name: string, link: string, definitionId: number, definitionName: string, longRunningValidations?: Map<string, number>): AbstractPipeline {
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

     function makeFakeTask(name: string, duration: number): AbstractPipelineTask {
        let task: AbstractPipelineTask = mock(BuildTask); 
        sinon.stub(task, "getName").returns(name);
        sinon.stub(task, "getDuration").returns(duration);
        return task;
     }

    test("Header is added to empty table",  () => {
       longRunTable = new LongRunningValidationsTable();
       longRunTable.addHeader("master", 98);
       expect(longRunTable.getCurrentCommentData()).toBe(messages.longRunningValidationCommentTableHeading.format("98", "master") + "\n|---|---|---|---|---|<!--longRunningValidationTable-->");
    });

    test("Section is not added to table without header",  () => {
        longRunTable = new LongRunningValidationsTable();
        let current: AbstractPipeline = makeFakePipeline("pipeline", "pipelineLink", 7, "defName", null);
        let recent: AbstractPipeline = makeFakePipeline("otherPipeline", "otherPipelineLink", 7, undefined);
        longRunTable.addSection(current, "link", makeFakeBranch("branch", recent), 2, [makeFakeTask("abc", 123)], [120]);
        expect(longRunTable.getCurrentCommentData()).toBe("");
    });

    test("Single task section is added to table with existing data",  () => {
        longRunTable = new LongRunningValidationsTable(messages.longRunningValidationCommentTableHeading.format("95", "master") + " \n|---|---|---|---|---|<!--longRunningValidationTable-->");
        let current: AbstractPipeline = makeFakePipeline("pipeline", "pipelineLink", 7, "defName", null);
        let recent: AbstractPipeline = makeFakePipeline("otherPipeline", "otherPipelineLink", 7, undefined);
        longRunTable.addSection(current, "link", makeFakeBranch("branch", recent), 2, [makeFakeTask("abc", 123)], [120]);
        expect(longRunTable.getCurrentCommentData()).toBe(messages.longRunningValidationCommentTableHeading.format("95", "master") + " \n|---|---|---|---|---|\n|[defName](pipelineLink)| abc |123 ms|120 ms|[otherPipeline](otherPipelineLink)|<!--longRunningValidationTable-->")
    });

    test("Multi task section is added to table with existing data",  () => {
        longRunTable = new LongRunningValidationsTable(messages.longRunningValidationCommentTableHeading.format("95", "master") + "\n|---|---|---|---|---|<!--longRunningValidationTable-->");
        let current: AbstractPipeline = makeFakePipeline("pipeline", "pipelineLink", 7, "defName", null);
        let recent: AbstractPipeline = makeFakePipeline("otherPipeline", "otherPipelineLink", 7, undefined);
        longRunTable.addSection(current, "link", makeFakeBranch("branch", recent), 2, [makeFakeTask("abc", 123), makeFakeTask("xyz", 321)], [120, 130]);
        expect(longRunTable.getCurrentCommentData()).toBe(messages.longRunningValidationCommentTableHeading.format("95", "master") + "\n|---|---|---|---|---|\n|[defName](pipelineLink)| abc |123 ms|120 ms|[otherPipeline](otherPipelineLink)|\n| | xyz |321 ms|130 ms| |<!--longRunningValidationTable-->");
    });
    });