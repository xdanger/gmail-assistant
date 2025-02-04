/**
 * Retrieves the OpenAI API key from the user properties.
 * If the key is not set, throws an error with instructions for the user.
 *
 * @return {string} The OpenAI API key.
 * @throws {Error} If the API key is not set in the user properties.
 */
function getOpenAIKey() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('OPENAI_API_KEY');

  if (!token) {
    // Log the error and throw an exception with clear instructions
    Logger.log('ERROR: OpenAI API key is not set. Please register the token as the user.');

    // Throw an error with step-by-step instructions for setting the key
    throw new Error(
      'OpenAI API key is not set.\n\n' +
      'Please follow these steps to register the API key:\n' +
      '1. Open the Google Apps Script Editor.\n' +
      '2. Run the following function:\n\n' +
      '   setOpenAIKey("YOUR_OPENAI_API_KEY");\n\n' +
      'Note: Replace "YOUR_OPENAI_API_KEY" with the actual API key.'
    );
  }

  // Return the API key if it is set
  return token;
}
/**
 * Custom Google Sheets function to interact with OpenAI's Assistant API.
 * It creates a thread, sends the user's message, and retrieves the response in one go.
 *
 * @param {string} content The input from the user.
 * @param {string} asst_id The assistant_id of OpenAI Assistant API.
 * @param {string(optional)} When thread_id is not specified, it creates a new thread.
 * @return {string} The response from the OpenAI Assistant.

function askOpenAIAssistant(content, asst_id, thread_id = null) {
  const apiKey = getOpenAIKey(); // Throws an error if the key is not set

  const HEADERS = {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
  };

  if (!asst_id.startsWith("asst_")) {
    throw new Error("Invalid `asst_id`: " + asst_id);
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
        assistant_id: asst_id,
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
 */
/**
 * callOpenAIStructuredOutputs: Calls the OpenAI Chat Completions API with Structured Outputs enabled.
 *
 * @param {string} userText - The user's input text to be converted into structured JSON.
 * @param {Object} schemaObj - The JSON Schema object describing the required output structure.
 * @return {Array|Object} The JSON-parsed model output (most commonly an array if the schema is defined as `type="array"`).
 * @throws {Error} If the API call fails, the model refuses (refusal), or no valid JSON is returned.
 */
function callOpenAIStructuredOutputs(userText, schemaObj) {

  // Retrieve the OpenAI API key from the script properties
  const apiKey = getOpenAIKey(); // Throws an error if the key is not set
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  const payload = {
    model: "o3-mini", // Adjust model as needed
    reasoning_effort: "high",
    messages: [
      { role: "user", content: userText }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "email_classification",
        strict: true,
        schema: schemaObj
      }
    }
    // max_completion_tokens: 512
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      Authorization: "Bearer " + apiKey
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(apiUrl, options);
  const result = JSON.parse(response.getContentText());

  if (result?.error) {
    throw new Error("OpenAI API error: " + JSON.stringify(result.error));
  }
  if (result?.choices?.[0]?.message?.refusal) {
    throw new Error("Refusal: " + result.choices[0].message.refusal);
  }
  const content = result.choices[0].message?.content;
  // console.log(content.length);
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error("Failed to parse JSON content: " + content);
  }
}