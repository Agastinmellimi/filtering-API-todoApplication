const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");

const connetDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

connetDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return requestQuery.status != undefined && requestQuery.priority != undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority != undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status != undefined;
};

// GET todo using query parameters API
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
              SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

// GET todo based on Specific todo_id API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const todoList = await db.get(getTodoQuery);
  response.send(todoList);
});

// POST todo API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

// PUT(UPDATE) todo of specific todo_id API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status != undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority != undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo != undefined:
      updateColumn = "Todo";
      break;
  }
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(getTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `UPDATE todo
  SET todo = '${todo}', priority = '${priority}', status = '${status}'
  WHERE id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// DELETE todo API
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
