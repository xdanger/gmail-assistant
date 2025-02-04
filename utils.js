function setLastProcessedMessage() {
  const q =
    "Subject: Sectigo Order #496098213 SSL Expiry Notice - 10% Discount Inside";
  const threads = GmailApp.search(q);
  if (threads.length == 0) {
    return false;
  }
  const first_matched_thread = threads.shift();
  const timestamp = first_matched_thread.getLastMessageDate().getTime();
  const props = PropertiesService.getScriptProperties();
  props.setProperty("LastProcessedMessage_TS", timestamp.toString());
}

function listAllYourLabels() {
  var labels = GmailApp.getUserLabels();
  for (var i = 0; i < labels.length; i++) {
    Logger.log("label: " + labels[i].getName());
  }
}

/* OpenAI/Claude Function Call */
const tools = [{
  "type": "function",
  "function": {
    "name": "getLabels",
    "description": "Classificate/Identify email by muti-dimension attributes",
    "parameters": {
      "type": "object",
      "properties": {
        "category": { "type": "string" },
        "timesensitive": { "type": "boolean" },
        "handwritten": { "type": "boolean" }
      }
    }
  }
}
]

/*
const props = PropertiesService.getScriptProperties();
const geminiApiKey = props.getProperty("GEMINI_API_KEY");
const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-latest:generateContent?key=${geminiApiKey}`;
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});
*/
