/**
 * Custom Google Sheets function to interact with OpenAI's Assistant API.
 * It creates a thread, sends the user's message, and retrieves the response in one go.
 *
 * @param {string} content The input from the user.
 * @param {string} asst_id The Assistant_ID of OpenAI Assistant API.
 * @param {string(optional)} When thread_id is not specified, it creates a new thread.
 * @return {string} The response from the OpenAI Assistant.
 */
function askOpenAIAssistant(content, asst_id, thread_id = null) {
  const props = PropertiesService.getScriptProperties();
  const OPENAI_API_KEY = props.getProperty("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new ReferenceError(
      "`OPENAI_API_KEY` is not found in Script Properties.",
    );
  }

  const HEADERS = {
    Authorization: "Bearer " + OPENAI_API_KEY,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
  };

  const ASSISTANT_ID = asst_id;

  if (!ASSISTANT_ID.startsWith("asst_")) {
    throw new Error("Invalid `asst_id`: " + ASSISTANT_ID);
  }

  let passed_thread_id = false;
  if (thread_id === null) {
    // Create a thread
    let thread_resp = UrlFetchApp.fetch("https://api.openai.com/v1/threads", {
      method: "post",
      headers: HEADERS,
      muteHttpExceptions: true,
    });
    if (thread_resp.getResponseCode() !== 200) {
      throw new Error(
        "Failed to create thread. Response: " + thread_resp.getContentText(),
      );
    }
    let json = JSON.parse(thread_resp.getContentText());
    thread_id = json.id; // Adjust based on actual response format
  } else if (!thread_id.startsWith("thread_")) {
    throw new Error("Invalid `thread_id`: " + thread_id);
  } else {
    passed_thread_id = true;
  }

  // Send a message to the thread
  let message_resp = UrlFetchApp.fetch(
    `https://api.openai.com/v1/threads/${thread_id}/messages`,
    {
      method: "post",
      headers: HEADERS,
      payload: JSON.stringify({
        role: "user",
        content: content,
      }),
      muteHttpExceptions: true,
    },
  );
  if (message_resp.getResponseCode() !== 200) {
    throw new Error(
      "Failed to send message. Response: " + message_resp.getContentText(),
    );
  }
  // Run the thread using the assistant
  let run_resp = UrlFetchApp.fetch(
    `https://api.openai.com/v1/threads/${thread_id}/runs`,
    {
      method: "post",
      headers: HEADERS,
      payload: JSON.stringify({
        assistant_id: ASSISTANT_ID,
      }),
      muteHttpExceptions: true,
    },
  );
  if (run_resp.getResponseCode() !== 200) {
    throw new Error(
      "Failed to run thread. Response: " + run_resp.getContentText(),
    );
  }

  let run_data = JSON.parse(run_resp.getContentText());
  let run_id = run_data.id;
  let status = run_data.status;
  let start_time = new Date().getTime();

  // Poll the run status until it is 'completed'
  while (status === "queued" || status === "in_progress") {
    Utilities.sleep(500); // Wait for half a second before checking again
    const check_resp = UrlFetchApp.fetch(
      `https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`,
      {
        method: "get",
        headers: HEADERS,
        muteHttpExceptions: true,
      },
    );

    status = JSON.parse(check_resp.getContentText()).status;

    // Check for timeout to avoid exceeding the execution limit
    if (new Date().getTime() - start_time > 29000) {
      // 29 seconds limit to be safe
      throw new Error("Timeout waiting for the run to complete.");
    }
  }

  // Once the run is completed, fetch the final result
  if (status === "completed") {
    let message_resp = UrlFetchApp.fetch(
      `https://api.openai.com/v1/threads/${thread_id}/messages`,
      {
        method: "get",
        headers: HEADERS,
        muteHttpExceptions: true,
      },
    );

    let value;

    if (message_resp.getResponseCode() === 200) {
      let message_data = JSON.parse(message_resp.getContentText());
      // Iterate over messages to find the assistant's response
      for (let i = message_data.data.length - 1; i >= 0; i--) {
        const message = message_data.data[i];
        if (
          message.role === "assistant" &&
          message.content &&
          message.content.length > 0
        ) {
          // Assuming the first content item contains the text response
          let content_item = message.content.find((c) => c.type === "text");
          if (content_item && content_item.text && content_item.text.value) {
            value = content_item.text.value; // Return the text value of the assistant's message
          }
        }
      }
      if (!passed_thread_id) {
        UrlFetchApp.fetch(`https://api.openai.com/v1/threads/${thread_id}`, {
          method: "delete",
          headers: HEADERS,
          muteHttpExceptions: true,
        });
      }
      if (!value) {
        throw new Error("Assistant's final response not found.");
      } else {
        return value;
      }
    } else {
      throw new Error(
        "Failed to fetch messages. Response: " + message_resp.getContentText(),
      );
    }
  } else {
    throw new Error("Run did not complete successfully. Status: " + status);
  }
}