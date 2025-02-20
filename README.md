# Axios Mock Plugin

[![npm version](https://img.shields.io/npm/v/axios-mock-plugin.svg)](https://www.npmjs.com/package/axios-mock-plugin)
![Build status](https://github.com/tinas/axios-mock-plugin/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/tinas/axios-mock-plugin/branch/main/graph/badge.svg)](https://codecov.io/gh/tinas/axios-mock-plugin)
[![License](https://img.shields.io/npm/l/axios-mock-plugin.svg)](LICENSE)


Promise based mock adapter for axios.

## Table of Contents

- [Motivation](#motivation)
- [Features](#features)
- [Installing](#installing)
- [Usage Examples](#usage-examples)
- [Path Matching and Endpoint Management](#path-matching-and-endpoint-management)
- [Configuration Options](#configuration-options)
- [API](#api)
- [Types](#types)
- [Error Handling](#error-handling)
- [License](#license)

## Motivation

Axios Mock Plugin was created to simplify API mocking during frontend development and testing. It provides:

- An Express-like syntax for defining mock endpoints
- Seamless integration with existing Axios instances
- Full TypeScript support with type safety
- Flexible configuration for simulating real-world scenarios (delays, errors, logging, etc.)

Whether you’re building new features without a ready backend, running automated tests, or demonstrating your app offline, Axios Mock Plugin makes it easy to mock API responses.

## Features

- Express-style endpoint patterns (e.g. `GET /users/:id`)
- Dynamic URL parameters and query strings support
- Request body and header handling
- Configurable response delays and random errors
- Request/Response hooks for custom behaviors
- Out-of-the-box TypeScript support

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

## Usage Examples

### Basic Usage

```typescript
import axios from 'axios'
import { attachMockInterceptor } from 'axios-mock-plugin'

// Define mock endpoints
const endpoints = {
  'GET /users/:id': (req) => ({
    id: req.params.id,
    name: 'John Doe'
  })
}

// Attach mock interceptor
const { mocker } = attachMockInterceptor(axios, { endpoints })

// Make a mocked request
axios.get('/users/123', { mock: true })
  .then(response => console.log(response.data))
  // Output: { id: '123', name: 'John Doe' }
```

### Custom Mock Plugin Setup
This example demonstrates how to configure a custom mock plugin and how to eject the interceptor when it's no longer needed.

```typescript
import axios from 'axios'
import { AxiosMocker, AxiosRequestConfigWithMock, mergeOptions } from 'axios-mock-plugin'

// Define your mock endpoints
const endpoints = {
  'GET /users/:id': (req) => ({
    id: req.params.id,
    name: 'John Doe'
  })
}

// Create a new AxiosMocker instance with your configuration
const mocker = new AxiosMocker({
  endpoints,
  // Optionally, you can pass default mock options here
})

// Attach the mock plugin to your Axios instance
const interceptorId = axios.interceptors.request.use((config: AxiosRequestConfigWithMock) => {
  // Check if a mock configuration is provided in the request
  if (config.mock !== undefined) {
    // Merge default mock options with any options provided in the request config
    const mergedMockOptions = mergeOptions(mocker.getDefaultOptions(), config.mock)
    
    // If mocking is enabled, override the adapter to use the mocker's handleRequest method
    if (mergedMockOptions.enabled) {
      config.adapter = mocker.handleRequest.bind(mocker)
    }
  }

  // Additional conditions or modifications can be added here

  return config
})

// When the interceptor is no longer needed, eject it to clean up
axios.interceptors.request.eject(interceptorId)

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

axios.get('/users/123/posts/456?sortBy=date&page=1', { mock: true })
  .then(response => console.log(response.data))
// Output: {
//   userId: '123',
//   postId: '456',
//   sortBy: 'date',
//   page: '1'
// }
```

### Query Strings from Axios Params

```typescript
const endpoints = {
  'GET /users/:userId': (req, config) => ({
    userId: req.params.userId,
    sortBy: req.query.sortBy,
    page: req.query.page
  })
}

axios.get('/users/123', {
  params: { sortBy: 'date', page: 1 },
  mock: true
}).then(response => console.log(response.data))
// Output: {
//   userId: '123',
//   sortBy: 'date',
//   page: '1'
// }
```

### Both Query Sources
> **Note:** The URL search parameters are merged with the request's parameters. In this merge, neither set overrides the other; instead, a new object is created.

```typescript
const endpoints = {
  'GET /users/:userId': (req, config) => ({
    userId: req.params.userId,
    sortBy: req.query.sortBy,
    page: req.query.page,
    order: req.query.order
  })
}

axios.get('/users/123?page=1&order=asc', {
  params: { sortBy: 'date', page: 1 },
  mock: true
}).then(response => console.log(response.data))
// Output: {
//   userId: '123',
//   sortBy: 'date',
//   page: '1',
//   order: 'asc'
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

axios.post('/users',
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

## Path Matching and Endpoint Management
This example demonstrates how to define default endpoints when attaching the mock interceptor using the constructor, as well as how to add additional endpoints later using the `addEndpoint` method.

```typescript
import axios from 'axios'
import { attachMockInterceptor } from 'axios-mock-plugin'

// Attach the mock interceptor with default endpoints defined via the constructor.
const { mocker } = attachMockInterceptor(axios, {
  endpoints: {
    'GET /api/users/:id': (req) => ({
      id: req.params.id,
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@example.com'
    })
  }
})

// Dynamically add a new endpoint for POST requests to "/api/posts".
mocker.addEndpoint('POST /api/posts', (req) => ({
  id: req.body.id,
  title: req.body.title,
  content: req.body.content,
  createdAt: new Date().toISOString()
}))

// Dynamically add an endpoint for "/api/products/:id".
mocker.addEndpoint('GET /api/products/:id', (req) => ({
  id: req.params.id,
  name: 'Wireless Mouse',
  price: 29.99,
  currency: 'USD'
}))

// Example usage:

// This request matches the GET endpoint for "/api/users/:id" defined in the constructor.
// Expected response: { id: '123', firstName: 'Alice', lastName: 'Johnson', email: 'alice.johnson@example.com' }
axios.get('/api/users/123', { mock: true })
  .then(response => console.log('GET /api/users/123:', response.data))

// This request matches the POST endpoint for "/api/posts" added dynamically.
// Expected response: { id: '1', title: 'New Post', content: 'Post content', createdAt: '...' }
axios.post('/api/posts', { id: '1', title: 'New Post', content: 'Post content' }, { mock: true })
  .then(response => console.log('POST /api/posts:', response.data))

// This request matches the GET endpoint for "/api/products/:id" added dynamically.
// Expected response: { id: '456', name: 'Wireless Mouse', price: 29.99, currency: 'USD' }
axios.get('/api/products/456', { mock: true })
  .then(response => console.log('GET /api/products/456:', response.data))
```

## Configuration Options

### Default Options
The default configuration used by AxiosMocker is:


| Option         | Default Value | Description                                         |
|----------------|---------------|-----------------------------------------------------|
| `enabled`      | `true`        | Whether the mock adapter is enabled by default.     |
| `delay`        | `0`           | The response delay (in milliseconds).               |
| `errorRate`    | `0`           | The probability (0-1) to simulate random errors.    |
| `headers`      | `{}`          | Additional headers to include in the mock response. |
| `error`        | `undefined`   | A forced error configuration (if any).              |
| `getDelay`     | `undefined`   | A function to compute a dynamic delay per request.  |
| `enableLogging`| `false`       | Enables logging for request and response details.   |

### Global Configuration
When attaching the interceptor, you can set global options that apply to all requests:

```typescript
const { mocker } = attachMockInterceptor(axios, {
  endpoints: {
    'GET /users': () => [{ id: 1, name: 'John' }]
  },
  defaultOptions: {
    delay: 1000,           // Add a 1-second delay to all responses
    errorRate: 0.1,        // 10% chance to simulate random errors
    enableLogging: true,   // Enable detailed logging
    headers: {             // Add global response headers
      'x-custom-header': 'custom-value'
    },
    getDelay: (endpoint, axiosConfig) => {
      // Custom logic: for endpoints containing 'users', delay 2 seconds; otherwise, 1 second
      return endpoint.includes('users') ? 2000 : 1000
    }
  }
})
```

### Per-Request Configuration
Override the global or default options for a single request by passing a mock configuration:
```typescript
axios.get('/users/123', {
  mock: {
    delay: 2000,   // Override delay for this request
    errorRate: 0   // Disable random errors for this request
  }
})
```

> **Note:** Configuration precedence is: Request Config > Global Config > Default Config.

## API

### AxiosMocker Class

The `AxiosMocker` class is the core of the mock adapter. It allows you to configure mock endpoints, manage default options, and set up hooks for custom behaviors. Below is a summary of all public methods available in the class:

#### Constructor
Creates a new `AxiosMocker` instance. You can optionally provide a configuration object containing default options and endpoint definitions.

```typescript
constructor(config?: AxiosMockerConfig)
```
- Parameters:
  - `config` *(AxiosMockerConfig)*: Optional configuration object with:
    - `endpoints`: A mapping (object or Map) of endpoint definitions.
    - `defaultOptions`: Partial mock options to override the defaults.

#### clearEndpoints
Clears all registered mock endpoints from the instance.

```typescript
clearEndpoints(): void
```

#### setEndpoints
Replaces all currently registered endpoints with the provided endpoints.

```typescript
setEndpoints(endpoints: EndpointsMap): void
```

- Parameters:
  - `endpoints`: A Map or object literal containing endpoint definitions.


#### addEndpoints
Adds new endpoints to the existing set without clearing the current endpoints.

```typescript
addEndpoints(endpoints: EndpointsMap): void
```

- Parameters:
  - `endpoints`: A Map or object literal containing endpoint definitions.

#### addEndpoint
Adds a single endpoint with its corresponding handler.

```typescript
addEndpoint(endpoint: string, handler: MockEndpoint): void
```

- Parameters:
  - `endpoints`: *(string)*: The endpoint pattern (e.g., `"GET /users/:id"`).
  - `handler`: *(MockEndpoint)*: The function that handles the mock request.


#### removeEndpoint
Removes a previously registered endpoint.

```typescript
removeEndpoint(endpoint: string): void
```

- Parameters:
  - `endpoints`: *(string)*: The endpoint pattern to remove.


#### listEndpoints
Returns an array of all registered endpoint keys.

```typescript
listEndpoints(): string[]
```

- Returns:
  - `string[]`: *(string)*: A list of endpoint patterns.


#### getDefaultOptions
Retrieves the current default mock options used by the instance.


```typescript
getDefaultOptions(): InternalMockOptions
```

- Returns:
  - `InternalMockOptions`: The default options object.


#### updateDefaultOptions
Updates the default options with the provided partial configuration. The new options are merged with the existing ones.


```typescript
updateDefaultOptions(options: Partial<MockOptions>): void
```

- Parameters:
  - `options`: *(Partial<MockOptions>)*: An object containing the options to update.

#### addRequestHook
Adds a request hook that is executed before the endpoint handler is invoked. Hooks can perform additional processing or modifications on the mock request.

```typescript
addRequestHook(hook: (request: MockRequest) => void | Promise<void>): void
```

- Parameters:
  - `hook`: *(function)*: A function that receives the `MockRequest` object and optionally returns a promise.

#### addResponseHook
Adds a response hook that is executed after the endpoint handler returns a response. Hooks can perform additional processing or logging of the response.

```typescript
addResponseHook(hook: (response: AxiosResponse) => void | Promise<void>): void
```

- Parameters:
  - `hook`: *(function)*: A function that receives the Axios response object and optionally returns a promise.

#### handleRequest
Processes an Axios request using the registered mock endpoints and the configured options.
This method handles merging of query parameters (from URL and `axiosConfig.params`), simulates delays, applies error logic, and invokes request/response hooks.

```typescript
handleRequest(axiosConfig: AxiosRequestConfigWithMock): Promise<AxiosResponse>
```

- Parameters:
  - `axiosConfig`: *(AxiosRequestConfigWithMock)*: The Axios request configuration containing optional mock settings.
- Returns:
  - `Promise<AxiosResponse>`: A promise that resolves with a mocked Axios response.


### Additional API Functions


### attachMockInterceptor
Attaches a mock interceptor to an Axios instance. This interceptor uses the provided configuration (or defaults) to process requests with mock data.

```typescript
attachMockInterceptor(
  axiosInstance: AxiosInstance,
  config?: AxiosMockerConfig
): {
  mocker: AxiosMocker
  interceptorId: number
}
```

- Parameters:
  - `axiosInstance`: *(AxiosInstance)*: The Axios instance to attach the interceptor to.
  - `config`: *(AxiosMockerConfig, optional)*: Optional configuration for setting up the mocker.
- Returns:
  - An object containing the `mocker` instance and the `interceptorId` for later ejection.


### detachMockInterceptor
Removes the mock interceptor from the provided Axios instance using the `interceptorId`.

```typescript
detachMockInterceptor(
  axiosInstance: AxiosInstance,
  interceptorId: number
): void
```

- Parameters:
  - `axiosInstance`: *(AxiosInstance)*: The Axios instance from which to remove the interceptor.
  - `interceptorId`: *(number)*: The ID of the interceptor to eject.

## Types

### MockRequest
The request object passed to endpoint handlers:

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
The endpoint handler function type:

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
Request/Response hook types for custom behaviors:

```typescript
type RequestHook = (
  request: MockRequest,
  axiosConfig: AxiosRequestConfigWithMock
) => void | Promise<void>

type ResponseHook = (
  response: AxiosResponse,
  axiosConfig: AxiosRequestConfigWithMock
) => void | Promise<void>
```

## Error Handling
You can handle errors thrown by the mock adapter similarly to Axios errors:

```typescript
axios.get('/users/123', { mock: true })
  .catch(error => {
    if (error.response) {
      // The mock responded with an error status
      console.log(error.response.status)
      console.log(error.response.data)
    } else {
      // An error occurred during mock setup or a network error
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