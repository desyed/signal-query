# SignalQuery

SignalQuery is a lightweight and efficient query library for managing asynchronous data fetching and state management in JavaScript applications. It provides a simple yet powerful API for making HTTP requests and managing the resulting data using a reactive programming model.

## Features

- **Reactive State Management**: Utilizes a custom `Signal` class for reactive state updates.
- **Efficient HTTP Requests**: Supports GET, POST, PUT, and DELETE methods.
- **Caching**: Implements caching for GET requests to reduce network overhead.
- **Tag-Based Invalidation**: Allows for intelligent cache invalidation using tags.
- **TypeScript Support**: Built with TypeScript for enhanced type safety and developer experience.
- **Configurable**: Easily customizable with options for base URL, headers, and timeout.

## Installation

You can install SignalQuery using npm:

```bash
npm install signal-query
```

## Usage

### Basic Setup

First, create an instance of SignalQuery:

```typescript
import { SignalQuery } from 'signal-query';

const query = new SignalQuery();
```

### Making a GET Request

To make a GET request, use the `query.get` method:

```typescript
const result = query.get({ url: '/api/data', params: { id: 1 } });

// Access the result properties
console.log('Loading:', result.isLoading.value);
console.log('Data:', result.data.value);
console.log('Error:', result.error.value);
console.log('Success:', result.isSuccess.value);
console.log('Error occurred:', result.isError.value);

// You can also create an effect to react to changes
createEffect(() => {
  if (result.isLoading.value) {
    console.log('Loading data...');
  } else if (result.isError.value) {
    console.log('Error:', result.error.value);
  } else if (result.isSuccess.value) {
    console.log('Data loaded:', result.data.value);
  }
});

```

### Making a POST Request

To make a POST request, use the `query.post` method:

```typescript
const result = query.post({ url: '/api/data', data: { name: 'John', age: 30 } });
```

