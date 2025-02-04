function getUserPrompt(message) {
  return "You are a helpful assistant in managing my emails by classifying/ " +
    "identifying emails. In the following conversations, I will only send you the " +
    "email’s head information and body in plain text. You will reply to me with a " +
    "JSON object in this schema of TypeScript:\n\n" +
    "```typescript" +
    "\{\n" +
    "  category?: \"Receipts\" | \"Notices\" | \"Notices/OTP\" | \"Notices/Status\" | \"Feeds\" | \"Promotions\" | \"Others\";\n" +
    "  time_sensitive: boolean;\n" +
    "  machine_generated: boolean;\n" +
    "  handwritten: boolean;\n" +
    "  action_required: boolean;\n" +
    "}\n" +
    "```\n\n" +
    "- `category`: You categorize my email into one of these categories:\n" +
    "  - `Receipts`: Mostly machine-generated documents, such as paper trails, transactional receipts, bank statements (except notification of statements), and so on, should be archived for a long time.\n" +
    "  - `Notices`: This is a machine-generated email to notify me (or my group) of an event or a time-sensitive email that is unimportant or urgent enough for me to pay much attention to, such as social media updates, security alerts, or the results of something. The email is not helpful and is supposed to be deleted after 30/60 days.\n" +
    "  - `Notices/OTP`: This is a subcategory of `Notices`. Especially to verify my email address, containing several digital numbers or combined with short strings. It's time-sensitive. The email is not helpful and should be deleted after I proceed with it.\n" +
    "  - `Notices/Status`: This is a subcategory of `Notices`. Especially to inform me of the status of an online order, shipment and parcel tracking, an App in Google Play / App Store, or a website.\n" +
    "  - `Feeds`: This is an informational email worth reading, maybe my subscription, such as news, school newsletters, e-magazines, articles, and weekly/monthly reports (except machine-generated ones), not including marketing emails for promotion.\n" +
    "  - `Promotions`: This email is a marketing message that may be promotional, bulk, or commercial. It is possible that this email could be classified as spam.\n" +
    "  - `Others`: Any other email you cannot put into the categories above.\n" +
    "- `time_sensitive`: If the email is urgently, or need to be notified or replied immediately, set `time_sensitive` to `true`; otherwise, set it to `false`.\n" +
    "- `machine_generated`: If the email is machine-generated, set `machine_generated` to `true`; else, if you think the email was authored by a natural person, set it to `false`.\n" +
    "- `action_required`: If you think the email requires an action from me, set `action_required` to `true`; otherwise, set it to `false`.\n\n" +
    "Reply to me with the JSON object in the schema of TypeScript.\n\n" +
    "----BEGIN OF EMAIL HEADERS----\n" +
    "Date: " + message.getDate() + "\n" +
    "From: " + message.getFrom() + "\n" +
    "To: " + message.getTo() + "\n" +
    "Subject: " + message.getSubject() + "\n" +
    "----END OF EMAIL HEADERS----\n" +
    "----BEGIN OF EMAIL PLAIN BODY----\n" +
    message.getPlainBody().slice(0, 200000) + "\n" +
    "----END OF EMAIL PLAIN BODY----";
}

function main() {
  const schema = {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "The category of the email",
        enum: ["Receipts", "Notices", "Notices/OTP", "Notices/Status", "Feeds", "Promotions", "Others"]
      },
      time_sensitive: {
        type: "boolean",
        description: "Whether the email is time-sensitive to be replied immediately.",
      },
      machine_generated: {
        type: "boolean",
        description: "Whether the email is machine-generated.",
      },
      action_required: {
        type: "boolean",
        description: "Whether the email requires an action from me.",
      },
    },
    required: ["category", "machine_generated", "time_sensitive", "action_required"],
    additionalProperties: false
  };
  const props = PropertiesService.getScriptProperties();
  let last_processed_timestamp = props.getProperty("LastProcessedMessage_TS");
  if (last_processed_timestamp === null) {
    throw new ReferenceError(
      "`LastProcessedMessage_TS` is not found in ScriptProperties.",
    );
  }
  let threads = GmailApp.getInboxThreads()
    .filter((t) => t.getLastMessageDate().getTime() > last_processed_timestamp)
    .filter(
      (t) =>
        !t.getFirstMessageSubject().includes("failures for Google Apps Script"),
    )
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
    const content = getUserPrompt(last_message);
    let answ = callOpenAIStructuredOutputs(content, schema);
    // console.log(answ);
    console.log(`${last_message.getSubject()}\n${JSON.stringify(answ)}`);
    // Proceed with different actions by categories
    switch (answ.category) {
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
    if (
      [
        "Receipts",
        "Feeds",
        "Notices",
        "Notices/OTP",
        "Notices/Status",
      ].includes(answ.category)
    ) {
      t.addLabel(GmailApp.getUserLabelByName(answ.category));
    }
    if (answ.machine_generated) {
      t.removeLabel(GmailApp.getUserLabelByName("Handwritten"));
    } else {
      t.addLabel(GmailApp.getUserLabelByName("Handwritten"));
    }
    if (answ.action_required) {
      t.addLabel(GmailApp.getUserLabelByName("Action Required"));
    } else {
      t.removeLabel(GmailApp.getUserLabelByName("Action Required"));
    }
    if (["Notices", "Notices/Status", "Receipts", "Feeds"].includes(answ.category) && !answ.action_required) {
      t.moveToArchive();
    }
    if (answ.time_sensitive || !answ.machine_generated) {
      t.moveToInbox();
    }
    if (answ.time_sensitive && !answ.machine_generated) {
      t.markImportant();
    }
    last_processed_timestamp = t.getLastMessageDate().getTime();
  });
  props.setProperty("LastProcessedMessage_TS", last_processed_timestamp);
}
