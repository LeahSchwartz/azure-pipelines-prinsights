import { AbstractPipeline } from "./AbstractPipeline";
import { Branch } from "./Branch";
import './StringExtensions';
import { AbstractPipelineTask } from "./AbstractPipelineTask";
import tl = require('azure-pipelines-task-lib/task');

export abstract class AbstractTable {

    private currentCommentData: string;
    private headerFormat: string;
    private tableEndLine: string
    public static readonly NEW_LINE = "\n";
    public static readonly COLUMN_DIVIDER = "|";
    public static readonly HEADER_SYMBOL = "---";
    public static readonly TABLE_END_TAG = "<!--{0}-->";

    constructor(headerFormat: string, tableEndName: string, currentCommentData?: string) {
        this.headerFormat = headerFormat;
        this.tableEndLine = AbstractTable.TABLE_END_TAG.format(tableEndName);
        if (currentCommentData) {
            this.currentCommentData = currentCommentData;
        }
        else {
            this.currentCommentData = "";
        }
        tl.debug("table already exists in comment? " + this.tableHasData());
    }

    public addHeader(target: string): void {
        if (!this.tableHasData()) {
            this.addTextToTableInComment(this.headerFormat.format(target));
            let numberColumns: number = this.getNumberColumns(this.currentCommentData);
            this.addTextToTableInComment(AbstractTable.NEW_LINE + AbstractTable.COLUMN_DIVIDER);
            for (let i = 0; i < numberColumns; i++) {
                this.addTextToTableInComment(AbstractTable.HEADER_SYMBOL + AbstractTable.COLUMN_DIVIDER);
            }
        }
    }

    public abstract addSection(current: AbstractPipeline, currentDefinitionLink: string, target: Branch, numberPipelinesToConsiderForHealth: number, longRunningValidations: AbstractPipelineTask[], thresholdTimes: number[]): void;

    public getCurrentCommentData(): string {
        return this.currentCommentData;
    }

    protected tableHasData(): boolean {
        return this.currentCommentData.indexOf(this.tableEndLine) >= 0;
    }

    protected addTextToTableInComment(data: string): void {
        if (this.tableHasData()) {
            this.currentCommentData = this.currentCommentData.replace(this.tableEndLine, data + this.tableEndLine);
        }
        else {
            if (!this.commentIsEmpty()) {
                this.currentCommentData += AbstractTable.NEW_LINE + AbstractTable.NEW_LINE;
            }
            this.currentCommentData += data + this.tableEndLine;
        }
    }

    private commentIsEmpty(): boolean {
        return !this.currentCommentData || this.currentCommentData === "";
    }

    private getNumberColumns(line: string): number {
        let numberColumns: number = -1;
        for (let char of line) {
            if (char === AbstractTable.COLUMN_DIVIDER) {
                numberColumns++;
            }
        }
        return numberColumns;
    }

}