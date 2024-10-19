# WIP

Here's a sample README file for your `SignalQuery` API client, complete with usage instructions and an example use case:

```markdown
# SignalQuery API Client

`SignalQuery` is a lightweight and reactive API client for making HTTP requests in TypeScript. It leverages the `Signal` class to provide a reactive programming model, allowing easy state management and reactivity in your applications.

## Features

- **Reactive Data Management**: Automatically updates data in your application when API responses change.
- **Caching**: Supports caching of GET requests to reduce network overhead.
- **Tag-Based Revalidation**: Allows you to revalidate related data based on tags.
- **TypeScript Support**: Built with TypeScript for type safety and developer experience.

## Installation

```npm install signal-query```

## Usage

### Initialization

To use the `SignalQuery` client, you first need to create an instance by providing the base URL of your API.

```typescript
import { SignalQuery } from 'signal-query'; // Adjust the import based on your file structure

const apiClient = SignalQuery.create({
  baseUrl: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  },
});
```

### Making Requests

You can make various types of requests using the `get`, `post`, `put`, and `delete` methods.

#### Example Use Case

Let's consider a scenario where you want to fetch a list of users from an API and update the user data.

1. **Fetching Users**

```typescript
async function fetchUsers() {
  const result = await apiClient.get<User[]>('/users');

  if (result.isLoading) {
    console.log('Loading...');
  } else if (result.isError) {
    console.error('Error fetching users:', result.error);
  } else {
    console.log('Users fetched successfully:', result.data);
  }
}

fetchUsers();
```

2. **Creating a New User**

```typescript
async function createUser(newUser: User) {
  const result = await apiClient.post<User>('/users', newUser, {
    tags: ['users'], // Tag to revalidate related data
  });

  if (result.isLoading) {
    console.log('Creating user...');
  } else if (result.isError) {
    console.error('Error creating user:', result.error);
  } else {
    console.log('User created successfully:', result.data);
    // Optionally, fetch users again to see the updated list
    fetchUsers();
  }
}

const newUser: User = {
  name: 'John Doe',
  email: 'johndoe@example.com',
};

createUser(newUser);
```

3. **Updating an Existing User**

```typescript
async function updateUser(userId: string, updatedData: Partial<User>) {
  const result = await apiClient.put<User>(`/users/${userId}`, updatedData, {
    tags: ['users'], // Tag to revalidate related data
  });

  if (result.isLoading) {
    console.log('Updating user...');
  } else if (result.isError) {
    console.error('Error updating user:', result.error);
  } else {
    console.log('User updated successfully:', result.data);
    // Optionally, fetch users again to see the updated list
    fetchUsers();
  }
}

const updatedData = { email: 'john.new@example.com' };
updateUser('userId123', updatedData);
```

4. **Deleting a User**

```typescript
async function deleteUser(userId: string) {
  const result = await apiClient.delete(`/users/${userId}`, {
    tags: ['users'], // Tag to revalidate related data
  });

  if (result.isLoading) {
    console.log('Deleting user...');
  } else if (result.isError) {
    console.error('Error deleting user:', result.error);
  } else {
    console.log('User deleted successfully');
    // Optionally, fetch users again to see the updated list
    fetchUsers();
  }
}

deleteUser('userId123');
```

### Notes

- Ensure your API endpoints are configured to accept the respective HTTP methods and data formats.
- Customize headers and parameters as needed based on your API's requirements.

### License

This project is licensed under the MIT License. See the LICENSE file for details.

```

### Explanation
- **Overview**: Provides a brief description of what `SignalQuery` does.
- **Installation**: Instructions on how to add `SignalQuery` to your project.
- **Usage**: Details how to initialize the client and make API requests.
- **Example Use Case**: Demonstrates how to use the client to fetch, create, update, and delete users, which provides practical context for potential users.
- **Notes**: Encourages customization based on specific API needs.
- **License**: Basic licensing information.

Feel free to modify the content, especially the example user-related data structure and API endpoint URLs, to fit your specific use case!

