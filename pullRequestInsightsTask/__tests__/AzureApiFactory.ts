import { AzureApiFactory } from "../../src/AzureApiFactory";
import { EnvironmentConfigurations } from "../../src/EnvironmentConfigurations";
import sinon from "sinon";
import { HostTypeError } from "../../src/HostTypeError";
import { PipelineData } from "../../src/PipelineData";

describe("AzureApiFactory Tests", () => {
    
    let azureApiFactory: AzureApiFactory;
    let data: PipelineData;

    beforeEach(() =>{
        azureApiFactory = new AzureApiFactory();
        data = new PipelineData();
        sinon.stub(data, "getAccessKey").returns("fakeKey");
        sinon.stub(data, "getTeamUri").returns("fakeURI");
    });

    test("AzureApiFactory throws error when hostType is not build or release", async () => {
        sinon.stub(data, "getHostType").returns("other");
        expect(azureApiFactory.create(data)).rejects.toThrow(HostTypeError);
    });
});