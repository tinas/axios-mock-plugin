import { MockOptions } from './types'

declare module 'axios' {
  export interface AxiosRequestConfig {
    mock?: boolean | Partial<MockOptions>;
  }
}
