// This file exports common types used throughout the application.

export type ResponseData<T> = {
    success: boolean;
    data?: T;
    message?: string;
};

export type ErrorResponse = {
    success: false;
    error: string;
};

export type PaginatedResponse<T> = {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
};