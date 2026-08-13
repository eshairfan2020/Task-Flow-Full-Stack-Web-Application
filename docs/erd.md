# ERD (text form)

Draw this in dbdiagram.io, MySQL Workbench, or on paper — the relationships below come directly from the foreign keys in `backend/src/db/schema.sql`.

```
users (1) ───< (M) teams            [teams.owner_id → users.id]
users (M) ───< team_members >─── (M) teams    [many-to-many via junction table]
teams (1) ───< (M) tasks            [tasks.team_id → teams.id]
users (1) ───< (M) tasks            [tasks.assignee_id → users.id, nullable]
users (1) ───< (M) tasks            [tasks.created_by → users.id]
tasks (1) ───< (M) task_comments    [task_comments.task_id → tasks.id]
users (1) ───< (M) task_comments    [task_comments.user_id → users.id]
users (1) ───< (M) refresh_tokens   [refresh_tokens.user_id → users.id]
```

Key takeaways for the ERD topic specifically:
- `team_members` is a **junction table** — it's what turns a many-to-many relationship (a user can be on many teams, a team has many users) into two clean one-to-many relationships.
- `tasks.assignee_id` is nullable (`ON DELETE SET NULL`) because an unassigned task is valid, but `tasks.team_id` is required (`ON DELETE CASCADE`) because a task can't exist without a team.
