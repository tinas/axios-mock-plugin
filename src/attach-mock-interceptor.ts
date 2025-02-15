import { AxiosInstance } from 'axios'
import { AxiosMockerConfig, AxiosRequestConfigWithMock } from './types'
import { AxiosMocker } from './axios-mocker'

export function attachMockInterceptor(
  axiosInstance: AxiosInstance,
  config?: AxiosMockerConfig,
): { mocker: AxiosMocker; interceptorId: number } {
  const mocker = new AxiosMocker(config)
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
