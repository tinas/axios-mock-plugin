import { AxiosInstance } from 'axios'

export function detachMockInterceptor(
  axiosInstance: AxiosInstance,
  interceptorId: number,
): void {
  axiosInstance.interceptors.request.eject(interceptorId)
}
