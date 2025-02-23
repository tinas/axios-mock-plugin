declare module 'axios' {
  export interface AxiosRequestConfig {
    //@ts-expect-error
    mock?: boolean | Partial<MockOptions>;
  }
}
