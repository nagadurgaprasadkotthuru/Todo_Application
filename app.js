const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running at http://localhost:3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasTodo = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityAndHasStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//Get Todo API 1
app.get("/todos/", async (request, response) => {
  const requestQuery = request.query;
  const { search_q = "", priority, status } = requestQuery;
  let getTodoQuery = "";
  let todoQueryArray = null;
  if (hasPriorityAndHasStatus(requestQuery)) {
    getTodoQuery = `
    SELECT *
    FROM
    todo
    WHERE
    todo LIKE '%${search_q}%'
    AND
    priority = '${priority}'
    AND
    status = '${status}';`;
  } else if (hasPriority(requestQuery)) {
    //console.log("if block");
    getTodoQuery = `
        SELECT *
        FROM
        todo
        WHERE 
        todo LIKE '%${search_q}%' AND priority = '${priority}';`;
  } else if (hasStatus(requestQuery)) {
    //console.log("else block");
    getTodoQuery = `
            SELECT *
            FROM
            todo
            WHERE 
            todo LIKE '%${search_q}%'
            AND
            status = '${status}';`;
  } else {
    getTodoQuery = `
            SELECT *
            FROM
            todo
            WHERE 
            todo LIKE '%${search_q}%';`;
  }
  //console.log(getTodoQuery);
  todoQueryArray = await db.all(getTodoQuery);
  response.send(todoQueryArray);
});

//Get Single Todo API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT *
    FROM
    todo
    WHERE
    id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//Post Todo API 3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addTodoQuery = `
    INSERT INTO
    todo(
        id, todo, priority, status
    )VALUES(
        ${id}, '${todo}', '${priority}', '${status}'
    );`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//Update Todo API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestQuery = request.body;
  const { todo, priority, status } = requestQuery;
  let updateTodoQuery = "";
  if (hasStatus(requestQuery)) {
    updateTodoQuery = `
      UPDATE
      todo
      SET
      status = '${status}'
      WHERE
      id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Status Updated");
  } else if (hasPriority(requestQuery)) {
    updateTodoQuery = `
      UPDATE
      todo
      SET
      priority = '${priority}'
      WHERE
      id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Priority Updated");
  } else if (hasTodo(requestQuery)) {
    updateTodoQuery = `
      UPDATE
      todo
      SET
      todo = '${todo}'
      WHERE
      id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  }
});

//Delete Todo API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE
    FROM
    todo
    WHERE
    id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
