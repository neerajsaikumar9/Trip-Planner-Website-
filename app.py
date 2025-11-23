from flask import Flask, render_template, request, jsonify, send_file
from google.generativeai import GenerativeModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from bs4 import BeautifulSoup
import io

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = GenerativeModel('gemini-2.0-flash')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate_itinerary', methods=['POST'])
def generate_itinerary():
    try:
        data = request.json
        prompt = f"""Act as a travel expert and create a detailed day-by-day itinerary based on the following preferences:
        Destination: {data['destination']}
        Travel Dates: {data['startDate']} to {data['endDate']}
        Duration: {data['duration']} days
        Interests: {', '.join(data['interests'])}
        Budget: {data['budget']}
        Pace: {data['pace']}
        Special Considerations: {data['specialConsiderations']}

        Please provide a detailed itinerary with the following structure for each day:

        Day X - [Theme/Highlight of the Day]

        Morning (Time: XX:XX - XX:XX)
        - Detailed activity descriptions
        - Location details and travel tips
        - Estimated costs
        - Recommended breakfast spots

        Afternoon (Time: XX:XX - XX:XX)
        - Main activities and attractions
        - Location details and travel tips
        - Estimated costs
        - Lunch recommendations

        Evening (Time: XX:XX - XX:XX)
        - Evening activities and entertainment
        - Location details and travel tips
        - Estimated costs
        - Dinner suggestions

        Daily Tips:
        - Transportation recommendations
        - Local customs and etiquette
        - Weather considerations
        - Money-saving tips
        keep in mind that all currency is in INR(ruppees)
        Please ensure each section is clearly formatted and includes specific times, locations, and practical details for PDF presentation."""

        response = model.generate_content(prompt)
        return jsonify({'itinerary': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        prompt = f"""Act as a travel assistant. Answer the following user query based on the destination or trip context: {data['message']}"""
        
        response = model.generate_content(prompt)
        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_pdf', methods=['POST'])
def download_pdf():
    try:
        data = request.json
        html_content = data.get('content', '')
        
        # Parse HTML content
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        # Create styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            alignment=1
        )
        day_style = ParagraphStyle(
            'CustomDay',
            parent=styles['Heading2'],
            fontSize=18,
            spaceAfter=10
        )
        content_style = ParagraphStyle(
            'CustomContent',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=10
        )
        
        # Build PDF content
        story = []
        
        # Add title
        title = soup.find('h2', class_='itinerary-header')
        if title:
            story.append(Paragraph(title.text, title_style))
        
        # Add subtitle
        subtitle = soup.find('p', class_='itinerary-subtitle')
        if subtitle:
            story.append(Paragraph(subtitle.text, subtitle_style))
        
        # Add days
        days = soup.find_all('div', class_='itinerary-day')
        for day in days:
            # Add day header
            day_header = day.find('div', class_='day-header')
            if day_header:
                day_title = day_header.find('h3')
                day_subtitle = day_header.find('h4')
                if day_title:
                    story.append(Paragraph(day_title.text, day_style))
                if day_subtitle:
                    story.append(Paragraph(day_subtitle.text, content_style))
            
            # Add day content
            day_content = day.find('div', class_='day-content')
            if day_content:
                for element in day_content.children:
                    if element.name == 'ol' or element.name == 'ul':
                        for li in element.find_all('li'):
                            story.append(Paragraph(f"• {li.text}", content_style))
                    elif element.name == 'p':
                        story.append(Paragraph(element.text, content_style))
            
            story.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(story)
        
        # Reset buffer position
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='travel-itinerary.pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)