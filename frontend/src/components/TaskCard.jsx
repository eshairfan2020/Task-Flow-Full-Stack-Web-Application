import { memo } from 'react';

// React.memo: skips re-rendering this component if its props are
// shallow-equal to last render. Paired with useCallback on the parent's
// onClick handler (see TaskBoard.jsx), this avoids re-diffing every card
// in the Virtual DOM tree just because one sibling's state changed.
function TaskCard({ task, onClick }) {
  return (
    <div className={`task-card priority-${task.priority}`} onClick={() => onClick(task)}>
      <div className="task-title">{task.title}</div>
      <div className="task-meta">
        <span>{task.assignee_name || 'Unassigned'}</span>
        <span className="priority-tag">{task.priority}</span>
      </div>
    </div>
  );
}

export default memo(TaskCard);
