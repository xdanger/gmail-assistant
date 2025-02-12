/**
 * Retrieves the OpenRouter API key from the user properties.
 * If the key is not set, throws an error with instructions for the user.
 *
 * @return {string} The OpenRouter API key.
 * @throws {Error} If the API key is not set in the user properties.
 */
function getOpenRouterAPIKey() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('OPENROUTER_API_KEY');

  if (!token) {
    // Log the error and throw an exception with clear instructions
    Logger.log('ERROR: OpenRouter API key is not set.');

    // Throw an error with step-by-step instructions for setting the key
    throw new Error(
      'OpenRouter API key is not set.\n\n' +
      'Please follow these steps to register the API key:\n' +
      '1. Open the Google Apps Script Editor.\n' +
      '2. Run the following function:\n\n' +
      '   setOpenRouterAPIKey("YOUR_OPENROUTER_API_KEY");\n\n' +
      'Note: Replace "YOUR_OPENROUTER_API_KEY" with the actual API key.'
    );
  }

  // Return the API key if it is set
  return token;
}

/**
 * Sets the OpenRouter API key in the user properties.
 *
 * @param {string} key - The OpenRouter API key to be set.
 * @return {void}
 */
function setOpenRouterAPIKey(key) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('OPENROUTER_API_KEY', key);
}

/**
 * callOpenRouterStructuredOutputs: Calls the OpenRouter Chat Completions API with Structured Outputs enabled.
 *
 * @param {string} userText - The user's input text to be converted into structured JSON.
 * @param {Object} schemaObj - The JSON Schema object describing the required output structure.
 * @return {Array|Object} The JSON-parsed model output (most commonly an array if the schema is defined as `type="array"`).
 * @throws {Error} If the API call fails, the model refuses (refusal), or no valid JSON is returned.
 */
function callOpenRouterStructuredOutputs(userText, schemaObj) {

  // Retrieve the OpenRouter API key from the script properties
  const apiKey = getOpenRouterAPIKey(); // Throws an error if the key is not set
  const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    model: [ // Adjust model as needed
      "google/gemini-2.0-pro-exp-02-05",
      "google/gemini-2.0-flash-001",
      "openai/o3-mini",
      "anthropic/claude-3-5-sonnet:beta"],
    // reasoning_effort: "high",
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
    },
    // max_completion_tokens: 512
    // order: ["Google", "OpenAI", "Anthropic"],
    require_parameters: true,
    data_collection: false,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      Authorization: "Bearer " + apiKey,
      "HTTP-Referer": "https://github.com/xdanger/gmail-assistant",
      "X-Title": "Gmail Assistant"
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(apiUrl, options);
  const result = JSON.parse(response.getContentText());

  if (result?.error) {
    throw new Error("OpenRouter API error: " + JSON.stringify(result.error));
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