const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const isValidHeader = request?.headers && request?.headers?.username;
  const usersList = users;
  if (!isValidHeader) {
    return response.status(400).json({
      error: "Request header not provided.",
    });
  }
  const { username } = request.headers;

  const userAlreadyExists = usersList.find(
    (user) => user.username === username
  );

  if (!userAlreadyExists) {
    return response.status(404).json({
      error: "User not found.",
    });
  }

  request.username = username;
  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;
  const id = uuidv4();

  const alreadyExistsUsername = users.find(
    (user) => user.username === username
  );

  if (alreadyExistsUsername) {
    return response.status(400).json({
      error: "Username already in use.",
    });
  }

  const newUser = {
    id,
    name,
    username,
    todos: [],
  };
  users.push(newUser);
  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { todos } = users.find((user) => user.username === request.username);
  return response.json(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const newTodo = {
    id: uuidv4(), // precisa ser um uuid
    title: request.body.title,
    done: false,
    deadline: new Date(request.body.deadline),
    created_at: new Date(),
  };

  const userIndex = users.findIndex(
    (user) => user.username === request.username
  );
  const user = users.splice(userIndex, 1)[0];
  const userWithNewTodo = Object.assign({}, user, {
    todos: [...user.todos, newTodo],
  });
  users.push(userWithNewTodo);

  return response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { id: todoId } = request.params;
  const { title, deadline } = request.body;

  const userIndex = users.findIndex((user) => user.username === username);

  const todoList = users[userIndex].todos;
  const todoIndex = todoList.findIndex((td) => td.id === todoId);
  if (todoIndex < 0) {
    return response.status(404).json({ error: "Todo not found" });
  }
  const updatedTodo = Object.assign(todoList[todoIndex], {
    title,
    deadline: new Date(deadline),
  });
  todoList[todoIndex] = updatedTodo;

  users[userIndex].todos = todoList;

  return response.json(updatedTodo);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { id: todoId } = request.params;

  const userIndex = users.findIndex((user) => user.username === username);
  const userTodos = users[userIndex].todos;
  const todoIndex = userTodos.findIndex((td) => td.id === todoId);

  if (todoIndex < 0) {
    return response.status(404).json({ error: "Todo not found" });
  }

  const todoDone = Object.assign(userTodos[todoIndex], { done: true });
  users[userIndex].todos[todoIndex] = todoDone;

  return response.json(todoDone);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { username } = request;
  const { id: todoId } = request.params;

  const userIndex = users.findIndex((user) => user.username === username);
  const userTodos = users[userIndex].todos;
  const todoIndex = userTodos.findIndex((td) => td.id === todoId);

  if (todoIndex < 0) {
    return response.status(404).json({ error: "Todo not found" });
  }

  userTodos.splice(todoIndex, 1);

  users[userIndex].todos = userTodos;

  return response.status(204).json();
});

module.exports = app;
