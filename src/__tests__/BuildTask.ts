import * as azureBuildInterfaces from "azure-devops-node-api/interfaces/BuildInterfaces";
import sinon from "sinon";
import { BuildTask } from "../BuildTask";
import { AbstractPipelineTask } from "../AbstractPipelineTask";


describe('BuildTask Tests', () => {

   
    let task: AbstractPipelineTask;

    test("Task failed when it has failure status", () => {
        task = new BuildTask(" ", "", new Date("2019-05-23 01:14:40.00"), new Date("2019-05-24 02:15:55.00"), azureBuildInterfaces.TimelineRecordState.Completed, azureBuildInterfaces.TaskResult.Failed);
        expect(task.wasFailure()).toBe(true);
    });
    test("Task did not fail when it does not have failure status", () => {
        task = new BuildTask(" ", "", new Date("2019-05-23 01:14:40.00"), new Date("2019-05-24 02:15:55.00"), azureBuildInterfaces.TimelineRecordState.Completed, azureBuildInterfaces.TaskResult.Succeeded);
        expect(task.wasFailure()).toBe(false);
    });

    test("Correct duration is calculated", () => {
        task = new BuildTask(null, null, new Date("2019-05-23 01:14:40.00"), new Date("2019-05-24 02:15:55.00"), null, null);
        sinon.stub(task, "ran").returns(true);
        expect(task.getDuration()).toBe(90075000);
    });

    test("Null is returned for duration when task did not run", () => {
        task = new BuildTask(null, null, new Date("2019-05-23 01:14:40.00"), new Date("2019-05-24 02:15:55.00"), null, null);
        sinon.stub(task, "ran").returns(false);
        expect(task.getDuration()).toBeNull();
    });

    test("Task is long running when ran took longer than threshold time", () => {
        task = new BuildTask("abc", "123", null, null, null, null);
        sinon.stub(task, "getDuration").returns(100);
        sinon.stub(task, "ran").returns(true);
       expect(task.isLongRunning(90)).toBe(true);
    });

    test("Task is not long running when not complete", () => {
        task = new BuildTask("abc", "123", null, null, null, null);
        sinon.stub(task, "getDuration").returns(10);
        sinon.stub(task, "ran").returns(false);
        expect(task.isLongRunning(90)).toBe(false);
    });

    test("Task is not long running when no threshold time is given", () => {
        task = new BuildTask("abc", "123", null, null, null, null);
        sinon.stub(task, "getDuration").returns(10);
        sinon.stub(task, "ran").returns(true);
        expect(task.isLongRunning(null)).toBe(false);
    });

    test("Task ran when it is complete and has times", () => {
        task = new BuildTask(null, null, new Date("2019-05-23 01:14:40.00"), new Date("2019-05-24 02:15:55.00"), azureBuildInterfaces.TimelineRecordState.Completed, null);
        expect(task.ran()).toBe(true);
    });

    test("Task did not run when incomplete", () => {
        task = new BuildTask(null, null, new Date("2019-05-23 01:14:40.00"), new Date("2019-05-24 02:15:55.00"), azureBuildInterfaces.TimelineRecordState.InProgress, null);
        expect(task.ran()).toBe(false);
    });

     test("Task did not run when it has no start time", () => {
        task = new BuildTask(null, null, null, new Date("2019-05-24 02:15:55.00"), azureBuildInterfaces.TimelineRecordState.Completed, null);
        expect(task.ran()).toBe(false);
    });

    test("Task did not run when it has no end time", () => {
        task = new BuildTask(null, null, new Date("2019-05-23 01:14:40.00"), null, azureBuildInterfaces.TimelineRecordState.Completed, null);
        expect(task.ran()).toBe(false);
    });

    
    test("Task did not run when necessary field is missing", () => {
        task = new BuildTask(null, null, new Date("2019-05-23 01:14:40.00"), null, azureBuildInterfaces.TimelineRecordState.Completed, null);
        expect(task.ran()).toBe(false);
    });

    test("Tasks are equal when they have same id and name", () => {
       task = new BuildTask("abc", "123", null, null, azureBuildInterfaces.TimelineRecordState.InProgress, null);
       expect(task.equals(new BuildTask("abc", "123", null, null, azureBuildInterfaces.TimelineRecordState.Completed, null))).toBe(true);
    });

    test("Tasks are not equal when ids are different", () => {
        task = new BuildTask("abc", "13", null, null, null, null);
        expect(task.equals(new BuildTask("abc", "123", null, null, null, null))).toBe(false);
    });

    test("Tasks are not equal when names are different", () => {
        task = new BuildTask("ab", "123", null, null, null, null);
        expect(task.equals(new BuildTask("abc", "123", null, null, null, null))).toBe(false);
    });

});