function main() {
  const props = PropertiesService.getScriptProperties();
  const ASSISTANT_ID = props.getProperty('OPENAI_ASSISTANT_ID');
  if (!ASSISTANT_ID) {
    throw new ReferenceError("`OPENAI_ASSISTANT_ID` is not found in ScriptProperties.");
  }
  let last_processed_timestamp = props.getProperty('LastProcessedMessage_TS');
  if (last_processed_timestamp === null) {
    throw new ReferenceError("`LastProcessedMessage_TS` is not found in ScriptProperties.");
  }
  let threads = GmailApp.getInboxThreads()
    .filter((t) => t.getLastMessageDate().getTime() > last_processed_timestamp)
    .sort(
      (t1, t2) =>
        t1.getLastMessageDate().getTime() - t2.getLastMessageDate().getTime(),
    );
  console.log(`[${threads.length}] thread(s) need to be proceed.`);
  threads.forEach((t) => {
    const last_message_timestamp = t.getLastMessageDate().getTime();
    const last_message = t
      .getMessages()
      .find((m) => m.getDate().getTime() == last_message_timestamp);
    const content =
      `Date: ${last_message.getDate()}` +
      `\nFROM: ${last_message.getFrom()}` +
      `\nTOs: ${last_message.getTo()}` +
      `\nSubject: ${last_message.getSubject()}` +
      `\n------------------------\n` +
      last_message.getPlainBody();
    let answ = JSON.parse(askOpenAIAssistant(content, ASSISTANT_ID));

    console.log(`${last_message.getSubject()}\n${JSON.stringify(answ)}`);
    const cate = answ.category;
    // Proceed with different actions by categories
    switch (cate) {
      case "Promotions":
        Gmail.Users.Threads.modify(
          { addLabelIds: ["CATEGORY_PROMOTIONS"] },
          "me",
          t.getId(),
        );
        t.moveToArchive();
        break;
      case "Notices":
      case "Notices/Status":
        Gmail.Users.Threads.modify(
          { addLabelIds: ["CATEGORY_UPDATES"] },
          "me",
          t.getId(),
        );
        break;
      case "Receipts":
      case "Feeds":
        if (!t.isImportant() && t.isInInbox()) {
          t.moveToArchive();
        }
        break;
      default:
    }
    if (["Receipts", "Feeds", "Notices", "Notices/OTP", "Notices/Status"].includes(cate)) {
      t.addLabel(GmailApp.getUserLabelByName(cate));
    }
    if (answ.handwritten) {
      t.addLabel(GmailApp.getUserLabelByName("Handwritten"));
    } else {
      t.removeLabel(GmailApp.getUserLabelByName("Handwritten"));
    }
    if (answ.timesensitive || answ.handwritten) {
      t.moveToInbox();
    }
    if (answ.timesensitive && answ.handwritten) {
      t.markImportant();
    }
    last_processed_timestamp = t.getLastMessageDate().getTime();
  });
  props.setProperty("LastProcessedMessage_TS", last_processed_timestamp);
}
