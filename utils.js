
function setLastProcessedMessage() {
  const q =
    "JPM US Tech Fund on AI & Deepseek";
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

function getAMessage() {
  const q =
    "Sectigo Public Root CA Migration Timeline for S/MIME and TLS Certificates";
  const threads = GmailApp.search(q);
  if (threads.length == 0) {
    return false;
  }
  const first_matched_thread = threads.shift();
  threads.forEach((t) => {
    const last_message_timestamp = t.getLastMessageDate().getTime();
    const last_message = t
    console.log(t.getId())
  })
}