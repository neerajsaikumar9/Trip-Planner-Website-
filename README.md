# AI Itinerary Planner

A web application that helps users generate personalized travel itineraries using AI. The application uses the Gemini 2.0 Flash model to create detailed travel plans and provide travel assistance through an integrated chatbot.

## Features

- Generate personalized travel itineraries based on user preferences
- Interactive chatbot for travel-related queries
- Download itineraries as PDF
- Responsive design for all devices
- Clean and modern UI

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Python Flask
- AI: Gemini 2.0 Flash API
- PDF Generation: ReportLab

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-itinerary-planner
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

5. Run the application:
```bash
python app.py
```

6. Open your browser and navigate to `http://localhost:5000`

## Usage

1. Fill out the travel preferences form with:
   - Destination
   - Travel dates
   - Duration
   - Interests
   - Budget
   - Preferred pace
   - Special considerations

2. Click "Generate Itinerary" to get your personalized travel plan

3. Use the chatbot to ask questions about your trip

4. Download your itinerary as a PDF

## Project Structure

```
ai-itinerary-planner/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
├── templates/
│   └── index.html     # Main HTML template
└── static/
    ├── css/
    │   └── style.css  # Stylesheet
    └── js/
        └── script.js  # JavaScript code
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 