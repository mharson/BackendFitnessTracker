const express = require("express");
const router = express.Router();
const {
  updateRoutineActivity,
  canEditRoutineActivity,
  destroyRoutineActivity,
  getRoutineActivityById,
  getAllRoutineActivities,
  createRoutineActivity,
} = require("../db");
const client = require("../db/client");
const { requireUser, requiredNotSent } = require("./utils");

//GET /api/routine_activities
router.get("/", async (req, res, next) => {
  try {
    const routine_activities = await getAllRoutineActivities();
    res.send(routine_activities);
  } catch (error) {
    next(error);
  }
});

// GET /api/activities/:Id
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const activities = await getActivityById(id);
    if (activities) {
      res.send(activities);
    } else {
      next({
        name: "NotFound",
        message: `No Activity found for Activity ${req.params.activityId}`,
      });
    }
  } catch (error) {
    next(error);
  }
});

//POST /api/routine_activities
router.post(
  "/",
  requireUser,
  requiredNotSent({
    requiredParams: ["id", "routineId", "activityId", "duration", "count"],
  }),
  async (req, res, next) => {
    try {
      const { id, routineId, activityId, duration, count } = req.body;
      const exisitngRoutineActivities = await getRoutineActivityById(id);
      if (exisitngRoutineActivities) {
        next({
          name: "NotFound",
          message: `A RoutineActivity with this ${id} already exists`,
        });
      } else {
        const createdRoutineActivity = await createRoutineActivity({
          id,
          routineId,
          activityId,
          duration,
          count,
        });
        if (createdRoutineActivity) {
          res.send(createdRoutineActivity);
        } else {
          next({
            ame: "FailedToCreate",
            message: "There was an error creating your  Routine activity",
          });
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/routine_activities/:routineActivityId
router.patch(
  "/:routineActivityId",
  requireUser,
  requiredNotSent({ requiredParams: ["count", "duration"], atLeastOne: true }),
  async (req, res, next) => {
    try {
      const { count, duration } = req.body;
      const { routineActivityId } = req.params;
      const routineActivityToUpdate = await getRoutineActivityById(
        routineActivityId
      );
      if (!routineActivityToUpdate) {
        next({
          name: "NotFound",
          message: `No routine_activity found by ID ${routineActivityId}`,
        });
      } else {
        if (
          !(await canEditRoutineActivity(
            req.params.routineActivityId,
            req.user.id
          ))
        ) {
          res.status(403);
          next({
            name: "Unauthorized",
            message: "You cannot edit this routine_activity!",
          });
        } else {
          const updatedRoutineActivity = await updateRoutineActivity({
            id: req.params.routineActivityId,
            count,
            duration,
          });
          res.send(updatedRoutineActivity);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/routine_activities/:routineActivityId
router.delete("/:routineActivityId", requireUser, async (req, res, next) => {
  try {
    if (
      !(await canEditRoutineActivity(req.params.routineActivityId, req.user.id))
    ) {
      res.status(403);
      next({
        name: "Unauthorized",
        message: "You cannot edit this routine_activity!",
      });
    } else {
      const deletedRoutineActivity = await destroyRoutineActivity(
        req.params.routineActivityId
      );
      res.send({ success: true, ...deletedRoutineActivity });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
