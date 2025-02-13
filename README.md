# Gmail Assistant

An intelligent Gmail management system built with Google Apps Script that automatically processes, categorizes, and creates tasks from emails using AI.

## Features

- **Automatic Email Classification** into categories:
  - `Receipts`: Machine-generated documents, transaction records
  - `Notices`: System notifications and alerts
  - `Notices/OTP`: One-time passwords and verification codes
  - `Notices/Status`: Order tracking and status updates
  - `Feeds`: Newsletters and subscriptions
  - `Promotions`: Marketing and promotional content
  - `Others`: Uncategorized emails

- **Smart Labeling**
  - Automatically applies Gmail categories (Promotions, Updates)
  - Labels emails based on sender type (Human, AI, Machine)
  - Marks time-sensitive and action-required emails
  - Creates custom labels for different categories

- **Task Management**
  - Automatically creates Google Tasks from action items in emails
  - Links tasks back to original emails
  - Supports due dates and task descriptions
  - Includes email summaries in task notes

- **Intelligent Processing**
  - Uses AI to generate email summaries in Chinese
  - Identifies time-sensitive content
  - Detects required actions from email content
  - Determines if emails are machine, AI, or human-generated

## Setup

1. **Enable Required Google Services**:
   - Google Tasks API
   - Gmail API
   - Google Apps Script API

2. **Set up Script Properties**:

   ```javascript
   TASK_LIST_ID          // Your Google Tasks list ID
   OPENROUTER_API_KEY    // Your OpenRouter API key
   ```

3. **Create Gmail Labels**:
   - Receipts
   - Notices
   - Notices/OTP
   - Notices/Status
   - Feeds
   - Human
   - AI
   - TODO

## Configuration

### OpenRouter Integration

The system uses OpenRouter API to access various AI models for email processing. Set up your API key in the script properties:

```txt
OPENROUTER_API_KEY = <YOUR_OPENROUTER_API_KEY>
```

### Email Processing Rules

The system processes emails based on:

- Time sensitivity
- Required actions
- Sender type (human/AI/machine)
- Content category

## Usage

The main processing function `main()` automatically:

1. Fetches unprocessed emails
2. Analyzes content using AI
3. Applies appropriate labels
4. Creates tasks for actionable items
5. Archives or moves emails based on rules

## Dependencies

- Google Apps Script
- Google Tasks API
- Gmail API
- OpenRouter API (for AI processing)

## File Structure

- `main.js`: Core email processing logic
- `Tasks.js`: Google Tasks integration
- `OpenRouter.js`: AI service integration
- `OpenAI.js`: Alternative AI service integration (optional)

## Error Handling

The system includes comprehensive error handling for:

- API authentication
- Task creation
- Email processing
- AI service integration

## Notes

- Emails are processed in chronological order
- System maintains a timestamp of last processed message
- Task creation includes links back to original emails
- AI summaries are generated in Simplified Chinese

## License

This project is open source and available under the MIT License.
