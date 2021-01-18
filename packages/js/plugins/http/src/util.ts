import {AxiosResponse, AxiosRequestConfig} from "axios"
import {Request, Response, Header} from "./data"

/**
 * Convert AxiosResponse<string> to Response
 * 
 * @param axiosResponse 
 */
export function fromAxiosResponse(axiosResponse: AxiosResponse<string>): Response {
    let responseHeaders: Header[] = [];
    for (let key of Object.keys(axiosResponse.headers)) {
        responseHeaders.push({key: key, value: axiosResponse.headers[key]})
    }

    let response = {
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        headers: responseHeaders,
    }

    // encode bytes as base64 string if response is array buffer
    if (axiosResponse.config.responseType == "arraybuffer") {
        return {
            ...response,
            body: Buffer.from(axiosResponse.data).toString("base64"),
        }
    } else {
        return {
            ...response,
            body: axiosResponse.data,
        }
    }
}

/**
 * Creates AxiosRequestConfig from Request
 * 
 * @param request 
 */
export function toAxiosRequestConfig(request: Request): AxiosRequestConfig {
    const urlParams = request.urlParams?.reduce((params, p) => {
        return {...params, [p.key]: p.value}
    }, {})

    const requestHeaders = request.headers?.reduce((headers, h) => {
        return {...headers, [h.key]: h.value}
    }, {})

    let config: AxiosRequestConfig = {
        // @ts-ignore
        responseType: request.responseType.toLocaleLowerCase(),
    }

    // if (request.body) {
    //     config = {...config, data: request.body}
    // }

    if (urlParams) {
        config = {...config, params: urlParams}
    }

    if (requestHeaders) {
        config = {...config, headers: requestHeaders}
    }
    
    return config
}