import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)

# WARNING: Directly embedding your API key is insecure.
# This is only for temporary testing and should NOT be used in production.
api_key = "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"  # REPLACE WITH YOUR ACTUAL KEY

if not api_key:
    print("Error: OPENAI_API_KEY not set.")
    exit()
else:
    print("OpenAI API Key found (directly in code - insecure!).")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

# OpenRouter API base URL
OPENROUTER_API_BASE_URL = "https://openrouter.ai/api/v1"

def check_model_uptime_openrouter(model_id):
    """
    Checks if a specific model is available using a simple heuristic
    for OpenRouter, as they might not have a direct /uptime endpoint.
    We'll try to list models and see if ours is present.
    """
    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        response = requests.get(f"{OPENROUTER_API_BASE_URL}/models", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if "data" in data:
                for model_info in data["data"]:
                    if model_info.get("id") == model_id:
                        return True, None
                return False, f"Model '{model_id}' not found in OpenRouter's model list."
            else:
                return False, "Could not parse OpenRouter's model list response."
        else:
            return False, f"Error fetching OpenRouter model list: Status code {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Error fetching OpenRouter model list: {e}"

@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    if request.method == 'POST':
        try:
            data = request.get_json()
            symptoms = data.get('symptoms')
            heart_rate = data.get('heartRate')
            language = data.get('language', 'en')

            print(f"Received symptoms: {symptoms}")
            print(f"Received heart rate: {heart_rate}")
            print(f"User language: {language}")

            if not symptoms:
                return jsonify({'error': 'Symptoms are required'}), 400

            prompt_en = f"As a professional AI medical doctor, analyze the following: Symptoms: {symptoms}. Heart rate: {heart_rate} BPM. Provide a concise potential medical concern (max 1 line), a critical initial action (max 1 line), and one key thing to immediately avoid (max 1 line). Respond with only these three lines, starting with 'Concern:', 'Action:', and 'Avoid:'."
            prompt_hi = f"एक पेशेवर एआई मेडिकल डॉक्टर के रूप में, निम्नलिखित का विश्लेषण करें: लक्षण: {symptoms}. हृदय गति: {heart_rate} बीपीएम। एक संक्षिप्त संभावित चिकित्सा चिंता (अधिकतम 1 पंक्ति), एक महत्वपूर्ण प्रारंभिक कार्रवाई (अधिकतम 1 पंक्ति), और एक मुख्य चीज जिससे तुरंत बचना चाहिए (अधिकतम 1 पंक्ति) प्रदान करें। केवल इन तीन पंक्तियों के साथ प्रतिक्रिया दें, 'Concern:', 'Action:', और 'Avoid:' से शुरू करें।"
            prompt_bn = f"একজন পেশাদার এআই মেডিকেল ডাক্তার হিসাবে, নিম্নলিখিত বিষয়গুলি বিশ্লেষণ করুন: লক্ষণ: {symptoms}। হৃদস্পন্দন: {heart_rate} বিপিএম। একটি সংক্ষিপ্ত সম্ভাব্য চিকিৎসা উদ্বেগ (সর্বোচ্চ 1 লাইন), একটি গুরুত্বপূর্ণ প্রাথমিক পদক্ষেপ (সর্বোচ্চ 1 লাইন), এবং একটি মূল জিনিস যা অবিলম্বে এড়ানো উচিত (সর্বোচ্চ 1 লাইন) প্রদান করুন। শুধুমাত্র এই তিনটি লাইন দিয়ে উত্তর দিন, 'Concern:', 'Action:', এবং 'Avoid:' দিয়ে শুরু করুন।"

            if language == 'hi':
                prompt = prompt_hi
            elif language == 'bn':
                prompt = prompt_bn
            else:
                prompt = prompt_en

            print(f"Generated Prompt: {prompt}")

            model_to_use = "mistralai/mistral-tiny"

            is_available, uptime_error = check_model_uptime_openrouter(model_to_use)
            if not is_available:
                error_message = f"Model '{model_to_use}' is currently unavailable or not supported by OpenRouter."
                if uptime_error:
                    error_message += f" Details: {uptime_error}"
                return jsonify({'error': error_message}), 503

            try:
                response = client.chat.completions.create(
                    model=model_to_use,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=100,
                    temperature=0.3,
                    extra_headers={
                        "HTTP-Referer": "http://your-website.com",
                        "X-Title": "Your Health Analyzer App"
                    }
                )

                print(f"Full OpenAI Response (using {model_to_use}): {response}")

                if response.choices and response.choices[0].message and response.choices[0].message.content:
                    ai_response = response.choices[0].message.content.strip()
                    print(f"OpenRouter Response (using {model_to_use}): {ai_response}")

                    concern = "Unclear."
                    action = "Seek medical advice."
                    avoid = "Self-treatment."

                    for line in ai_response.split('\n'):
                        line = line.strip()
                        if line.startswith("Concern:"):
                            concern = line.replace("Concern:", "").strip()
                        elif line.startswith("Action:"):
                            action = line.replace("Action:", "").strip()
                            if len(action.split()) > 20:  # Increased word limit
                                action = "Get help now."
                        elif line.startswith("Avoid:"):
                            avoid = line.replace("Avoid:", "").strip()
                            if len(avoid.split()) > 20:  # Increased word limit
                                avoid = "Delaying care."

                    analysis_result = {
                        'issue': concern,
                        'treatment': action,
                        'avoid': avoid
                    }
                else:
                    analysis_result = {
                        'issue': 'No AI response.',
                        'treatment': 'No AI response.',
                        'avoid': 'No AI response.'
                    }

                return jsonify(analysis_result)

            except Exception as e:
                print(f"Error during OpenRouter API call (using {model_to_use}): {e}")
                return jsonify({'error': f"OpenRouter API error with {model_to_use}: {str(e)}"}), 500

        except Exception as e:
            print("Error during request processing:")
            print(e)
            return jsonify({'error': str(e)}), 500

    return jsonify({'message': 'Invalid request method'}), 400

@app.route('/api/sensor_heart_rate', methods=['GET'])
def get_sensor_heart_rate():
    import random
    heart_rate = random.randint(60, 100)
    return jsonify({'heart_rate': heart_rate})

@app.route('/api/toggle_sensor', methods=['POST'])
def toggle_sensor():
    return jsonify({'message': 'Sensor toggled (simulated)'})

if __name__ == '__main__':
    app.run(debug=True)