import { AxiosInstance } from 'axios'
import { AxiosMockerConfig, AxiosRequestConfigWithMock } from './types'
import { AxiosMocker } from './axios-mocker'
import { mergeOptions } from './utils'

export function attachMockInterceptor(
  axiosInstance: AxiosInstance,
  config?: AxiosMockerConfig,
): { mocker: AxiosMocker; interceptorId: number } {
  const mocker = new AxiosMocker(config)
  const interceptorId = axiosInstance.interceptors.request.use((config: AxiosRequestConfigWithMock) => {
    if (config.mock !== undefined) {
      const mergedMockOptions = mergeOptions(mocker.getDefaultOptions(), config.mock)
      if (mergedMockOptions.enabled) {
        config.adapter = mocker.handleRequest.bind(mocker)
      }
    }
    return config
  })
  return { mocker, interceptorId }
}
