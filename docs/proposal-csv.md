# Proposal for Recording Points in CSV

## Introduction Details

The goal of this proposal is to define a solution to efficiently record and manage the points of our Discord bot users. The aim is to create a storage system that allows filtering information by user, month, and year, facilitating both manual queries and automated processing.

## Background

Initially, the idea of having a single CSV file with all the records was considered. However, some concerns arose:

- **Ease of use:** A single large file can be difficult to handle and view, especially for non-technical users.
- **Performance:** Processing a very large file can affect query efficiency.
- **Scalability:** As the amount of data grows, it will become harder to find and filter the necessary information.

Therefore, it is proposed to separate the information into multiple files, organized into folders.

## Proposed Solution

### File Organization

The idea is to store the records in separate CSV files, organized in a folder structure following the hierarchy below:

```md
/data
├── <YEAR>
│├── \<MONTH\>
││├── <user_id>.csv
```

**Example:**

```md
/data
├── 2025
│ ├── 03
│ │ ├── 1007642713530839213.csv (Points for this user in March)
│ │ ├── 123456789012345678.csv
│ │ ├── ...
│ ├── 04
│ │ ├── ...
```

### CSV Format

Each CSV file will contain the following fields, enabling filtering and point calculation:

- `date`
- `project`
- `task_name`
- `thread_link`
- `points`
- `boosted_points`

**Example CSV content:**

```csv
date,project,task_name,thread_link,points,boosted_points
2025-04-15T13:26:47.680Z,novabot,feat/calendar-reminder-is-not-working,https://discord.com/channels/1007694606244262010/1354048877182976041,5,0
```

## Details of the Points Recording Proposal

## Introduction

This proposal defines the solution to efficiently record and manage the points of Discord bot users. The aim is to create a storage system that allows filtering information by user, month, and year, facilitating both manual queries and automated processing.

## Technical Functionality

### Points Recording

When the bot detects an event (e.g., task completion or point assignment), a function (e.g., `savePoints`) will:

- Retrieve the current date to determine the year and month.
- Create the necessary folders if they do not exist.
- Save the record in the corresponding CSV file for the user in that month.

### Points Query and Calculation

Functions will be implemented to:

- Read the CSV files of a user for a specific month or year.
- Sum the points and generate total reports, facilitating filtering and analysis of the information.

### Discord Integration

- Commands (e.g., `/points`) will be created so that both users and administrators can query their points.
- Optionally, a command could be implemented to download the corresponding CSV file using Discord's file attachment functionality.

## Benefits

### Ease of Access

The structure by year, month, and user allows quickly finding the required file, avoiding the overload of a single large file.

### Scalability and Performance

By dividing the information into smaller files, queries are optimized, and the bot's performance is improved.

### Compatibility

The CSV format is widely recognized and can be easily opened in tools like Excel or Google Sheets, making it accessible for non-technical users.

### Maintenance and Extensibility

This solution allows adding new functionalities in the future (such as summarized reports or cloud service integration) without a complete system restructuring.

## Conclusion

The proposal to separate point records into multiple CSV files organized into folders by year, month, and user offers an efficient and scalable solution. It facilitates filtering, querying, and maintaining the information, benefiting both end users and system administrators.
