import { AxiosInstance } from 'axios'
import { AxiosMockerOptions, AxiosRequestConfigWithMock } from './types'
import { AxiosMocker } from './axios-mocker'

export function attachMockInterceptor(
  axiosInstance: AxiosInstance,
  options?: AxiosMockerOptions,
): { mocker: AxiosMocker; interceptorId: number } {
  const mocker = new AxiosMocker(options)
  const interceptorId = axiosInstance.interceptors.request.use((config: AxiosRequestConfigWithMock) => {
    if (
      config.mock === true ||
      (typeof config.mock === 'object' && config.mock.enabled === true)
    ) {
      config.adapter = mocker.handleRequest.bind(mocker)
    }

    return config
  })
  return { mocker, interceptorId }
}
