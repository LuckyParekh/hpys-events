# HPYS Events App

A web app for **Hariprabodham Youths Sabha (HPYS) Scarborough** to manage and archive its bi-weekly gatherings. Paste a YouTube link and the app pulls in the details, so past sabhas, speakers, and topics stay organized and easy to find.

<!-- Add a screenshot or GIF here once you have one:
![HPYS Events App](docs/screenshot.png)
-->

## Features

- **YouTube import:** paste a URL and the app auto-extracts the thumbnail, topic, and date
- **Speaker (Vakta) directory:** profiles for each speaker along with their event history
- **Audio download:** save the audio from YouTube once the event has ended
- **Topics browser:** explore sabhas by topic
- **Upcoming and past events:** browse everything in one place, with search

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Backend  | Python, FastAPI, SQLite, yt-dlp     |
| Frontend | React, Vite, Tailwind CSS           |

Everything is free and open source. No paid APIs or API keys are required.

## Getting Started

### Prerequisites

- [Python](https://www.python.org/downloads/) 3.10+
- [Node.js](https://nodejs.org/) 18+
- [FFmpeg](https://ffmpeg.org/download.html) (recommended, used by yt-dlp for audio extraction and conversion)

### 1. Clone the repository

```bash
git clone https://github.com/LuckyParekh/hpys-events.git
cd hpys-events
```

### 2. Start the backend (Terminal 1)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. FastAPI's interactive docs are available at `http://localhost:8000/docs`.

### 3. Start the frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Usage

1. Open the app and add a new event by pasting a YouTube URL.
2. The thumbnail, topic, and date are filled in automatically. Review and adjust if needed.
3. Assign a speaker, or add a new one to the Vakta directory.
4. After the event, download the audio for your archive.
5. Use search and the topics browser to find past sabhas.

## Project Structure

```
hpys-events/
├── backend/     # FastAPI app, SQLite database, yt-dlp integration
├── frontend/    # React + Vite + Tailwind CSS interface
└── README.md
```

## Troubleshooting

- **Port already in use:** change the port, e.g. `uvicorn main:app --reload --port 8001`, and update the frontend's API base URL to match.
- **YouTube import or download fails:** YouTube changes often, so update yt-dlp with `pip install -U yt-dlp`.
- **Audio conversion errors:** make sure FFmpeg is installed and available on your `PATH`.

## Roadmap

- [ ] Deployment guide
- [ ] Admin login for managing events
- [ ] Calendar export for upcoming sabhas

## Contributing

Suggestions and improvements are welcome. Open an issue to discuss a change, or submit a pull request.

## Acknowledgements

Built for the youth community of Hariprabodham Youths Sabha Scarborough. Thanks to [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FastAPI](https://fastapi.tiangolo.com/), [React](https://react.dev/), and [Tailwind CSS](https://tailwindcss.com/).

## License

Add a license (e.g. MIT) to this repo and note it here.
