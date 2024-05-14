import express from "express";
import Todo from "../schemas/todo.schema.js";
import joi from "joi";

const router = express.Router();

/*유효성 검사*/
const createdTodoSchema = joi.object({
  value: joi.string().min(1).max(50).required(),
});

/* 할일 등록 */
router.post("/todos", async (req, res, next) => {
  //   const { value } = req.body;
  try {
    const validation = await createdTodoSchema.validateAsync(req.body);

    const { value } = validation;

    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: "해야할 일(value) 데이터가 존재하지 않습니다." });
    }

    const todoMaxOrder = await Todo.findOne().sort("-order").exec();

    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    const todo = new Todo({ value, order });
    await todo.save();

    return res.status(201).json({ todo });
  } catch (error) {
    next(error);
  }
});

/* 해야할 일 목록 조회 API */
router.get("/todos", async (req, res, next) => {
  const todos = await Todo.find().sort("-order").exec();

  return res.status(200).json({ todos });
});

/* 해야할 일 순서 변경 , 할 일 완료 / 해제, 내용 변경 API */
router.patch("/todos/:todoId", async (req, res) => {
  const todoId = req.params.todoId;
  const { order, done, value } = req.body;
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res.status(404).json({ errorMessage: "해야할 일이 없음" });
  }

  if (order) {
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }

    currentTodo.order = order;
  }
  if (done !== undefined) {
    currentTodo.doneAt = done ? new Date() : null;
  }

  if (value) {
    currentTodo.value = value;
  }

  await currentTodo.save();

  return res.status(200).json({});
});

/* 할 일 삭제 API */
router.delete("/todos/:todoId", async (req, res) => {
  const todoId = req.params.todoId;
  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res.status(404).json({ errorMessage: "삭제할 게 없음" });
  }
  await Todo.deleteOne({ _id: todoId });
  return res.status(200).json({});
});

export default router;
