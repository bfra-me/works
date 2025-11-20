# JSX Code Block Test

This file demonstrates JSX code blocks for testing React component extraction and linting.

## Simple Functional Component

```jsx
function Welcome({name}) {
  return (
    <div className="welcome">
      <h1>Hello, {name}!</h1>
      <p>Welcome to our application.</p>
    </div>
  )
}
```

## Component with State

```jsx
import {useState} from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className="counter">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}
```

## Component with Props and Children

```jsx
function Card({title, children, className}) {
  return (
    <div className={`card ${className ?? ''}`}>
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}
```

## Component with Event Handlers

```jsx
function Form({onSubmit}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({email, password})
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign In</button>
    </form>
  )
}
```

## List Rendering

```jsx
function UserList({users}) {
  return (
    <ul className="user-list">
      {users.map((user) => (
        <li key={user.id}>
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </li>
      ))}
    </ul>
  )
}
```

## Conditional Rendering

```jsx
function StatusMessage({isLoading, error, data}) {
  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>
  }

  if (!data) {
    return <div className="empty">No data available</div>
  }

  return <div className="success">Data loaded successfully</div>
}
```
