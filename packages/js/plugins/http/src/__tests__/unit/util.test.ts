import {fromAxiosResponse, toAxiosRequestConfig} from "../../util"

describe('converting axios response', () => {
    test('response type: text', () => {
        const response = fromAxiosResponse({
            status: 200, 
            statusText: "Ok", 
            data: "body-content", 
            headers: {["Accept"]: "application-json", ["X-Header"]: "test-value"},
            config: {responseType: "text"}
        });
    
        expect(response.headers).toStrictEqual([{key: "Accept", value: "application-json"}, {key: "X-Header", value: "test-value"}]);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("Ok");
        expect(response.body).toBe("body-content");
    })

    test('response type: arraybuffer', () => {
        const response = fromAxiosResponse({
            status: 200, 
            statusText: "Ok", 
            data: "body-content", 
            headers: {["Accept"]: "application-json", ["X-Header"]: "test-value"},
            config: {responseType: "arraybuffer"}
        });
    
        expect(response.headers).toStrictEqual([{key: "Accept", value: "application-json"}, {key: "X-Header", value: "test-value"}]);
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("Ok");
        expect(response.body).toBe(btoa("body-content"));
    })
})

describe('creating axios config', () => {
    test('with headers', () => {
        const config = toAxiosRequestConfig({
            headers: [{key: "Accept", value: "application-json"}, {key: "X-Header", value: "test-value"}], 
            responseType: "TEXT",
            body: "body-content"
        });
        
        expect(config.headers).toStrictEqual({["Accept"]: "application-json", ["X-Header"]: "test-value"});
        expect(config.params).toBeUndefined();
        expect(config.responseType).toBe("text");
    })

    test('with url params', () => {
        const config = toAxiosRequestConfig({
            urlParams: [{key: "tag", value: "data"}],
            responseType: "BINARY",
            body: "body-content"
        });
        
        expect(config.headers).toBeUndefined()
        expect(config.params).toStrictEqual({["tag"]: "data"});
        expect(config.responseType).toBe("arraybuffer");
    })
})


