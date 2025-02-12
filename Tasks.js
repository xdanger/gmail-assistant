/** An example of a Tasks.task object:
{
  // output-only properties, not inputable
  id: 'X0lTNEhqNk9oWC1SV1VuRw'
  webViewLink: 'https://tasks.google.com/task/_IS4Hj6OhX-RWUnG?sa=6',
  updated: '2025-02-09T12:55:21.000Z',
  etag: '"LTM1NjAzMzExOQ"',
  selfLink: 'https://www.googleapis.com/tasks/v1/lists/cFotb3UwbUNMWHhhcmVfZw/tasks/X0lTNEhqNk9oWC1SV1VuRw',
  kind: 'tasks#task',
  links:
  [ { description: '<email_subject>',
      link: 'https://mail.google.com/mail/#all/<email_message_id>',
      type: 'email' } ],
  title: '<action_description>',
  // inputable properties
  status: 'needsAction',
  position: '00000000000000000000',
  parent: 'X0lTNEhqNk9oWC1SV1VuRw',
  completed: '2025-02-09T12:55:21.000Z',
  due: '2025-02-12T00:00:00.000Z',
  notes: 'https://mail.google.com/mail/#all/<email_message_id>',
 }
 */

// Function to add a task with a due date to Google Tasks
function createTask(title, email_id, email_title, dueDate = null) {

  const properties = PropertiesService.getScriptProperties();
  const taskListId = properties.getProperty('TASK_LIST_ID');

  try {
    // Get the specified task list, or use default if not provided
    const taskList = Tasks.Tasklists.list()
      .items.find(list => list.id === taskListId) ||
      Tasks.Tasklists.list().items[0];

    // Create task object with required properties
    const task = {
      title: title,
      status: 'needsAction',
      // links: [
      //   {
      //     description: email_title,
      //     link: 'https://mail.google.com/mail/#all/' + email_id,
      //     type: 'email'
      //   }
      // ],
      notes: 'https://mail.google.com/mail/#all/' + email_id
    };

    // Add due date only if it's provided
    if (dueDate && dueDate !== "null") {
      // Format the date properly for Google Tasks API
      // Google Tasks API expects RFC 3339 timestamp
      const formattedDate = new Date(dueDate)
        .toISOString()
        .split('T')[0] + 'T00:00:00.000Z';
      task.due = formattedDate;
    }

    // Insert the task into the specified task list
    const createdTask = Tasks.Tasks.insert(task, taskList.id);

    // Log success message with task details
    Logger.log('Task created successfully:');
    Logger.log('Title: ' + createdTask.title);
    Logger.log('Due Date: ' + (createdTask.due || 'No due date'));
    Logger.log('Task ID: ' + createdTask.id);

    return createdTask;

  } catch (error) {
    // Log any errors that occur during task creation
    Logger.log('Error creating task: ' + error.toString());
    throw error;
  }
}
