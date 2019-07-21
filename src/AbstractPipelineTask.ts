
export abstract class AbstractPipelineTask {

    private name: string
    private id: string
    private startTime: Date
    private finishTime: Date

    constructor(name: string, id: string, startTime: Date, finishTime: Date) {
        this.name = name
        this.id = id;
        this.startTime = startTime;
        this.finishTime = finishTime;
    }

    
    protected abstract hasCompleteStatus(): boolean;

    public abstract wasFailure(): boolean;

    public getName(): string {
        return this.name;
    } 

    public getId(): string {
        return this.id;
    } 

    public equals(other: AbstractPipelineTask): boolean {
        return this.getName() === other.getName() && this.getId() === other.getId();
    }

    public isLongRunning(thresholdTime: number): boolean {
        let taskLength = this.getDuration();
        if (thresholdTime && taskLength && taskLength > thresholdTime) {
            return true;
        }
        return false;
    }

    public getDuration(): number {
        if (this.ran()) {
            return this.getTimeFromDate(this.finishTime) - this.getTimeFromDate(this.startTime);
        }
        return null;
    }

    public ran(): boolean {
        return (this.hasCompleteStatus()) && this.startTime != null && this.finishTime != null;
    }

    private getTimeFromDate(date: Date) {
        if (date) {
            return date.getTime();
        }
        return null;
    }

}
