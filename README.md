# Axios Mock Plugin

[![npm version](https://img.shields.io/npm/v/axios-mock-plugin.svg)](https://www.npmjs.com/package/axios-mock-plugin)
[![Build Status](https://img.shields.io/github/workflow/status/tinas/axios-mock-plugin/CI)](https://github.com/tinas/axios-mock-plugin/actions)
[![codecov](https://codecov.io/gh/tinas/axios-mock-plugin/branch/main/graph/badge.svg)](https://codecov.io/gh/tinas/axios-mock-plugin)
[![License](https://img.shields.io/npm/l/axios-mock-plugin.svg)](LICENSE)

Promise based mock adapter for axios.

## Table of Contents

- [Motivation](#motivation)
- [Features](#features)
- [Installing](#installing)
- [Example](#example)
  - [Basic Usage](#basic-usage)
  - [URL Parameters and Query Strings](#url-parameters-and-query-strings)
  - [Request Body and Headers](#request-body-and-headers)
- [API](#api)
  - [attachMockInterceptor](#attachmockinterceptoraxiosinstance-options)
  - [detachMockInterceptor](#detachmockinterceptoraxiosinstance-interceptorid)
- [Request Config](#request-config)
- [Types](#types)
  - [MockRequest](#mockrequest)
  - [MockEndpoint](#mockendpoint)
  - [Hooks](#hooks)
- [Configuration](#configuration)
  - [Default Config](#default-config)
  - [Global Config](#global-config)
  - [Request Config](#request-config-1)
- [Error Handling](#error-handling)
- [License](#license)

## Motivation

Axios Mock Plugin was created to simplify API mocking in frontend development and testing. While there are other mocking solutions available, this plugin aims to provide:

- A simple, Express-like syntax for defining mock endpoints
- Seamless integration with existing Axios instances
- Type-safe mocking with full TypeScript support
- Flexible configuration for simulating real-world scenarios

Whether you're developing a new feature without a ready backend, running automated tests, or demonstrating your application offline, Axios Mock Plugin helps you mock API responses with minimal effort.

## Features

- Express-style endpoint patterns (`GET /users/:id`)
- Dynamic URL parameters and query strings support
- Request body and headers handling
- Configurable response delays and random errors
- Request/Response hooks for custom behaviors
- TypeScript support out of the box

## Installing

Using npm:
```bash
$ npm install axios-mock-plugin
```

Using yarn:
```bash
$ yarn add axios-mock-plugin
```

Using pnpm:
```bash
$ pnpm add axios-mock-plugin
```

## Example

### Basic Usage

```typescript
import axios from 'axios'
import { attachMockInterceptor } from 'axios-mock-plugin'

const apiClient = axios.create()

// Define mock endpoints
const endpoints = {
  'GET /users/:id': (req) => ({
    id: req.params.id,
    name: 'John Doe'
  })
}

// Attach mock interceptor
const { mocker } = attachMockInterceptor(apiClient, { endpoints })

// Make a mocked request
apiClient.get('/users/123', { mock: true })
  .then(response => console.log(response.data))
  // Output: { id: '123', name: 'John Doe' }
```

### URL Parameters and Query Strings

```typescript
const endpoints = {
  'GET /users/:userId/posts/:postId': (req, config) => ({
    userId: req.params.userId,
    postId: req.params.postId,
    sortBy: req.query.sortBy,
    page: req.query.page
  })
}

apiClient.get('/users/123/posts/456?sortBy=date&page=1', { mock: true })
  .then(response => console.log(response.data))
  // Output: {
  //   userId: '123',
  //   postId: '456',
  //   sortBy: 'date',
  //   page: '1'
  // }
```

### Request Body and Headers

```typescript
const endpoints = {
  'POST /users': (req, config) => ({
    success: true,
    receivedData: req.body,
    contentType: config.headers['content-type']
  })
}

apiClient.post('/users',
  { name: 'John', email: 'john@example.com' },
  {
    headers: { 'content-type': 'application/json' },
    mock: true
  }
).then(response => console.log(response.data))
// Output: {
//   success: true,
//   receivedData: { name: 'John', email: 'john@example.com' },
//   contentType: 'application/json'
// }
```

## API

### attachMockInterceptor(axiosInstance, options)

Attaches a mock interceptor to an Axios instance.

```typescript
import { AxiosInstance } from 'axios'
import { AxiosMocker, AxiosMockerOptions } from 'axios-mock-plugin'

function attachMockInterceptor(
  axiosInstance: AxiosInstance,
  options?: AxiosMockerOptions
): {
  mocker: AxiosMocker
  interceptorId: number
}
```

### detachMockInterceptor(axiosInstance, interceptorId)

Removes the mock interceptor from an Axios instance.

```typescript
function detachMockInterceptor(
  axiosInstance: AxiosInstance,
  interceptorId: number
): void
```

## Request Config

The mock configuration extends Axios request config:

```typescript
interface AxiosRequestConfigWithMock extends InternalAxiosRequestConfig<any> {
  mock?: boolean | Partial<MockConfig>
}

interface MockConfig {
  enabled?: boolean
  delay?: number
  errorRate?: number
  headers?: Record<string, string>
  error?: {
    status?: number
    message?: string
    details?: unknown[]
  }
  getDelay?: (config: AxiosRequestConfigWithMock, endpoint: string) => number
  enableLogging?: boolean
}
```

## Types

### MockRequest

Request object passed to endpoint handlers:

```typescript
interface MockRequest<
  Params = Record<string, unknown>,
  Query = Record<string, unknown>,
  Body = unknown
> {
  params: Params
  query: Query
  body: Body
}
```

### MockEndpoint

Endpoint handler function type:

```typescript
type MockEndpoint<
  Params = Record<string, unknown>,
  Query = Record<string, unknown>,
  Body = unknown
> = (
  request: MockRequest<Params, Query, Body>,
  axiosConfig: AxiosRequestConfigWithMock
) => unknown | Promise<unknown>
```

### Hooks

Request/Response hook types:

```typescript
type RequestHook = (
  request: MockRequest,
  config: AxiosRequestConfigWithMock
) => void | Promise<void>

type ResponseHook = (
  response: AxiosResponse,
  config: AxiosRequestConfigWithMock
) => void | Promise<void>
```

## Configuration

### Default Config

```typescript
const defaultConfig: NormalizedMockConfig = {
  enabled: true,      // Mock interceptor is enabled by default
  delay: 0,          // No delay
  errorRate: 0,      // No random errors
  headers: {},       // No additional headers
  error: undefined,  // No forced errors
  getDelay: undefined, // No dynamic delay
  enableLogging: false // Logging is disabled
}
```

### Global Config

You can set global configuration when attaching the interceptor:

```typescript
const { mocker } = attachMockInterceptor(axios, {
  endpoints: {
    'GET /users': () => [{ id: 1, name: 'John' }]
  },
  config: {
    delay: 1000,           // Add 1s delay to all requests
    errorRate: 0.1,        // 10% chance of random error
    enableLogging: true,   // Enable request/response logging
    headers: {             // Add global headers
      'x-custom-header': 'custom-value'
    },
    getDelay: (config, endpoint) => {
      // Custom delay logic
      return endpoint.includes('users') ? 2000 : 1000
    }
  }
})
```

### Request Config

Override configuration for individual requests:

```typescript
axios.get('/users/123', {
  mock: {
    delay: 2000,     // Override delay for this request only
    errorRate: 0     // Disable random errors for this request
  }
})
```

Configuration precedence: Request Config > Global Config > Default Config

## Error Handling

```typescript
apiClient.get('/users/123', { mock: true })
  .catch(error => {
    if (error.response) {
      // Mock responded with error status
      console.log(error.response.status)
      console.log(error.response.data)
    } else {
      // Mock setup error or network error
      console.log(error.message)
    }
  })
```

## License

MIT License

Copyright (c) 2025 Ahmet Tinastepe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.