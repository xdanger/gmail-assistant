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
