import { AbstractTable } from "./AbstractTable";
import messages from "../resources/user_messages.json";
import { Branch } from "../dataModels/Branch";
import { PipelineTask } from "../dataModels/PipelineTask";
import { AbstractPipeline } from "../dataModels/AbstractPipeline";
import * as tl from "azure-pipelines-task-lib/task";

export class FailureTable extends AbstractTable {
  constructor(currentCommentData?: string) {
    super(
      messages.failureCommentTableHeading,
      messages.failureCommentTableEndName,
      currentCommentData
    );
  }

  public addSection(
    current: AbstractPipeline,
    currentDefinitionLink: string,
    target: Branch,
    numberPipelinesToConsiderForHealth: number,
    longRunningValidations: PipelineTask[]
  ): void {
    tl.debug("table has data?: " + this.tableHasData());
    if (this.tableHasData()) {
      if (current.isFailure()) {
        let messageString: string = messages.failureCommentRow;
        if (target.isHealthy(numberPipelinesToConsiderForHealth)) {
          messageString = messages.successCommentRow;
        }
        this.addTextToTableInComment(
          AbstractTable.NEW_LINE +
            messageString.format(
              current.getDefinitionName(),
              current.getLink(),
              target.getTruncatedName(),
              currentDefinitionLink
            )
        );
      }
    }
  }
}
