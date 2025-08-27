interface RequestBody {
    [key: string]: any;
}

interface RequestParams {
    [key: string]: string;
}

interface RequestQuery {
    [key: string]: string | string[];
}

interface CustomRequest {
    body: RequestBody;
    params: RequestParams;
    query: RequestQuery;
}

export type { RequestBody, RequestParams, RequestQuery, CustomRequest };