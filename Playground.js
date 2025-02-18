function listTaskLists() {
  const taskLists = Tasks.Tasklists.list();
  if (!taskLists.items) {
    console.log('No task lists found.');
    return;
  }
  for (let i = 0; i < taskLists.items.length; i++) {
    const taskList = taskLists.items[i];
    console.log('Task list with title "%s" and ID "%s" was found.', 
      taskList.title, taskList.id);
  }
}

/**
 * Lists task items for a provided tasklist ID.
 * @param  {string} taskListId The tasklist ID.
 * @see https://developers.google.com/tasks/reference/rest/v1/tasks/list
 */
function listTasks(taskListId = "cFotb3UwbUNMWHhhcmVfZw") {
  try {
    // List the task items of specified tasklist using taskList id.
    const tasks = Tasks.Tasks.list(taskListId);
    // If tasks are available then print all task of given tasklists.
    if (!tasks.items) {
      console.log('No tasks found.');
      return;
    }
    // Print the task title and task id of specified tasklist.
    for (let i = 0; i < tasks.items.length; i++) {
      const task = tasks.items[i];
      console.log('Task with title "%s" and ID "%s" was found.', task.title, task.id);
      console.log(task)
    }
  } catch (err) {
    // TODO (developer) - Handle exception from Task API
    console.log('Failed with an error %s', err.message);
  }
}

/**
 * { 
    webViewLink: 'https://tasks.google.com/task/_IS4Hj6OhX-RWUnG?sa=6',
    updated: '2025-02-09T12:55:21.000Z',
    etag: '"LTM1NjAzMzExOQ"',
    selfLink: 'https://www.googleapis.com/tasks/v1/lists/cFotb3UwbUNMWHhhcmVfZw/tasks/X0lTNEhqNk9oWC1SV1VuRw',
    status: 'needsAction',
    kind: 'tasks#task',
    position: '00000000000000000000',
    links: 
    [ { description: 'Next steps for Zhencheng\'s application to Wolfeboro Camp School',
        link: 'https://mail.google.com/mail/#all/194932fff36f7e6c',
        type: 'email' } ],
    title: 'Next steps for Zhencheng\'s application to Wolfeboro Camp School',
    id: 'X0lTNEhqNk9oWC1SV1VuRw'
 * }
 */


