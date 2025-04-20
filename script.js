document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const symptomsDisplay = document.getElementById('symptoms');
    const manualHeartRateInput = document.getElementById('manualHeartRate');
    const submitHeartRateButton = document.getElementById('submitHeartRate');
    const heartRateDisplay = document.getElementById('heartRate');
    const analyzeButton = document.getElementById('analyzeButton');
    const issueDisplay = document.getElementById('issue');
    const treatmentDisplay = document.getElementById('treatment');
    const avoidDisplay = document.getElementById('avoid');
    const languageSelector = document.getElementById('language');
    const sensorHeartRateDisplay = document.getElementById('sensorHeartRate'); // Added display for sensor HR

    let recordedSymptoms = '';
    let currentHeartRate = null;
    let recognition;
    let currentLanguage = 'en'; // Default language
    let speechSynthesisUtterance = null; // To manage the speech utterance
    let sensorInterval; // Variable to hold the interval for fetching sensor data

    const languageText = {
        en: {
            recordSymptoms: 'Record Symptoms',
            stopRecording: 'Stop Recording',
            youSaid: 'You said:',
            speechRecognitionError: 'Error recording voice.',
            speechRecognitionUnsupported: 'Your browser does not support speech recognition.',
            enterHeartRate: 'Enter Heart Rate',
            enterBPM: 'Enter BPM',
            submitHeartRate: 'Submit Heart Rate',
            heartRate: 'Manual HR:',
            sensorHeartRate: 'Sensor HR:',
            pleaseEnterValidHeartRate: 'Please enter a valid heart rate.',
            analyze: 'Analyze',
            potentialIssue: 'Potential Issue:',
            treatment: 'Treatment:',
            thingsToAvoid: 'Things to Avoid:',
            pleaseSpeakSymptoms: 'Please speak your symptoms.',
            pleaseEnterHeartRate: 'Please enter and submit your heart rate.',
            analyzing: 'Analyzing...',
            noSpecificIssue: 'No specific issue identified.',
            noInformationProvided: 'No information provided.',
            noSpecificAdvice: 'No specific advice.',
            errorDuringAnalysis: 'Error during analysis.'
        },
        hi: {
            recordSymptoms: 'लक्षण रिकॉर्ड करें',
            stopRecording: 'रिकॉर्डिंग बंद करें',
            youSaid: 'आपने कहा:',
            speechRecognitionError: 'आवाज रिकॉर्ड करने में त्रुटि।',
            speechRecognitionUnsupported: 'आपका ब्राउज़र वाक् पहचान का समर्थन नहीं करता है।',
            enterHeartRate: 'हृदय गति दर्ज करें',
            enterBPM: 'बीपीएम दर्ज करें',
            submitHeartRate: 'हृदय गति जमा करें',
            heartRate: 'मैनुअल एचआर:',
            sensorHeartRate: 'सेंसर एचआर:',
            pleaseEnterValidHeartRate: 'कृपया एक मान्य हृदय गति दर्ज करें।',
            analyze: 'विश्लेषण करें',
            potentialIssue: 'संभावित समस्या:',
            treatment: 'उपचार:',
            thingsToAvoid: 'बचने योग्य चीजें:',
            pleaseSpeakSymptoms: 'कृपया अपने लक्षण बोलें।',
            pleaseEnterHeartRate: 'कृपया अपनी हृदय गति दर्ज करें और जमा करें।',
            analyzing: 'विश्लेषण कर रहा हूँ...',
            noSpecificIssue: 'कोई विशेष समस्या नहीं पहचानी गई।',
            noInformationProvided: 'कोई जानकारी उपलब्ध नहीं कराई गई।',
            noSpecificAdvice: 'कोई विशेष सलाह नहीं।',
            errorDuringAnalysis: 'विश्लेषण के दौरान त्रुटि।'
        },
        bn: {
            recordSymptoms: 'লক্ষণ রেকর্ড করুন',
            stopRecording: 'রেকর্ডিং বন্ধ করুন',
            youSaid: 'আপনি বলেছেন:',
            speechRecognitionError: 'ভয়েস রেকর্ড করতে সমস্যা।',
            speechRecognitionUnsupported: 'আপনার ব্রাউজার স্পিচ রিকগনিশন সমর্থন করে না।',
            enterHeartRate: 'হৃদস্পন্দন প্রবেশ করুন',
            enterBPM: 'বিপিএম প্রবেশ করুন',
            submitHeartRate: 'হৃদস্পন্দন জমা দিন',
            heartRate: 'ম্যানুয়াল এইচআর:',
            sensorHeartRate: 'সেন্সর এইচআর:',
            pleaseEnterValidHeartRate: 'অনুগ্রহ করে একটি সঠিক হৃদস্পন্দন প্রবেশ করুন।',
            analyze: 'বিশ্লেষণ করুন',
            potentialIssue: 'সম্ভাব্য সমস্যা:',
            treatment: 'চিকিৎসা:',
            thingsToAvoid: 'এড়িয়ে চলুন:',
            pleaseSpeakSymptoms: 'অনুগ্রহ করে আপনার লক্ষণগুলি বলুন।',
            pleaseEnterHeartRate: 'অনুগ্রহ করে আপনার হৃদস্পন্দন প্রবেশ করুন এবং জমা দিন।',
            analyzing: 'বিশ্লেষণ করা হচ্ছে...',
            noSpecificIssue: 'কোন নির্দিষ্ট সমস্যা সনাক্ত করা যায়নি।',
            noInformationProvided: 'কোন তথ্য প্রদান করা হয়নি।',
            noSpecificAdvice: 'কোন নির্দিষ্ট পরামর্শ নেই।',
            errorDuringAnalysis: 'বিশ্লেষণের সময় ত্রুটি।'
        }
        // Add more languages here
    };

    function updateText(lang) {
        currentLanguage = lang;
        const text = languageText[lang];
        startButton.textContent = text.recordSymptoms;
        if (stopButton) stopButton.textContent = text.stopRecording;
        if (symptomsDisplay.textContent.startsWith(languageText['en'].youSaid)) {
            symptomsDisplay.textContent = `${text.youSaid} ${recordedSymptoms}`;
        } else if (symptomsDisplay.textContent === languageText['en'].speechRecognitionError) {
            symptomsDisplay.textContent = text.speechRecognitionError;
        } else if (symptomsDisplay.textContent === languageText['en'].speechRecognitionUnsupported) {
            symptomsDisplay.textContent = text.speechRecognitionUnsupported;
        }
        const enterHeartRateLabel = document.querySelector('#heartRate + label');
        if (enterHeartRateLabel) enterHeartRateLabel.textContent = text.enterHeartRate;
        manualHeartRateInput.placeholder = text.enterBPM;
        submitHeartRateButton.textContent = text.submitHeartRate;
        if (heartRateDisplay.textContent.startsWith(languageText['en'].heartRate)) {
            heartRateDisplay.textContent = `${text.heartRate} ${currentHeartRate || ''} BPM`;
        } else if (heartRateDisplay.textContent === languageText['en'].pleaseEnterValidHeartRate) {
            heartRateDisplay.textContent = text.pleaseEnterValidHeartRate;
        }
        if (sensorHeartRateDisplay && sensorHeartRateDisplay.textContent.startsWith(languageText['en'].sensorHeartRate)) {
            // Keep the sensor HR label
        } else if (sensorHeartRateDisplay) {
            sensorHeartRateDisplay.textContent = `${text.sensorHeartRate} ...`;
        }
        if (analyzeButton) analyzeButton.textContent = text.analyze;
        issueDisplay.textContent = `${text.potentialIssue} ${issueDisplay.dataset.value || ''}`;
        treatmentDisplay.textContent = `${text.treatment} ${treatmentDisplay.dataset.value || ''}`;
        avoidDisplay.textContent = `${text.thingsToAvoid} ${avoidDisplay.dataset.value || ''}`;
    }

    languageSelector.addEventListener('change', (event) => {
        updateText(event.target.value);
    });

    // Initialize text with the default language
    updateText(currentLanguage);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage; // Set initial language for speech recognition

        recognition.onstart = () => {
            startButton.textContent = languageText[currentLanguage].listening || 'Listening...';
            symptomsDisplay.textContent = '';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            recordedSymptoms = transcript;
            symptomsDisplay.textContent = `${languageText[currentLanguage].youSaid} ${transcript}`;
            startButton.textContent = languageText[currentLanguage].recordSymptoms;
            console.log('Symptoms recorded:', transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            startButton.textContent = languageText[currentLanguage].recordSymptoms;
            symptomsDisplay.textContent = languageText[currentLanguage].speechRecognitionError;
        };

        recognition.onend = () => {
            startButton.textContent = languageText[currentLanguage].recordSymptoms;
            console.log('Speech recognition ended.');
        };

        startButton.addEventListener('click', () => {
            recordedSymptoms = '';
            recognition.lang = currentLanguage; // Update language before starting
            recognition.start();
        });

        if (stopButton) {
            stopButton.addEventListener('click', () => {
                if (recognition) {
                    recognition.stop();
                    startButton.textContent = languageText[currentLanguage].recordSymptoms;
                }
            });
        }
    } else {
        symptomsDisplay.textContent = languageText[currentLanguage].speechRecognitionUnsupported;
        startButton.disabled = true;
        if (stopButton) stopButton.disabled = true;
    }

    submitHeartRateButton.addEventListener('click', () => {
        const heartRate = manualHeartRateInput.value;
        if (heartRate && !isNaN(heartRate) && Number(heartRate) > 0) {
            currentHeartRate = Number(heartRate);
            heartRateDisplay.textContent = `${languageText[currentLanguage].heartRate} ${currentHeartRate} BPM`;
            console.log('Heart Rate entered:', currentHeartRate);
        } else {
            heartRateDisplay.textContent = languageText[currentLanguage].pleaseEnterValidHeartRate;
            currentHeartRate = null;
        }
        manualHeartRateInput.value = '';
    });

    function speakAnalysis(text, lang) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel(); // Cancel any ongoing speech
            speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
            speechSynthesisUtterance.lang = lang;

            // Try to set the voice based on the language
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(voice => voice.lang.startsWith(lang));
            if (selectedVoice) {
                speechSynthesisUtterance.voice = selectedVoice;
            }

            speechSynthesis.speak(speechSynthesisUtterance);
        } else {
            alert('Your browser does not support text-to-speech.');
        }
    }

    function fetchSensorHeartRate() {
        fetch('/api/sensor_heart_rate') // Backend endpoint to get sensor data
            .then(response => {
                if (!response.ok) {
                    console.error('Error fetching sensor heart rate:', response.status);
                    if (sensorHeartRateDisplay) {
                        sensorHeartRateDisplay.textContent = `${languageText[currentLanguage].sensorHeartRate} Error`;
                    }
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (data && data.heart_rate) {
                    const hr = parseInt(data.heart_rate);
                    if (!isNaN(hr) && sensorHeartRateDisplay) {
                        sensorHeartRateDisplay.textContent = `${languageText[currentLanguage].sensorHeartRate} ${hr} BPM`;
                        // Update currentHeartRate with sensor value if available
                        currentHeartRate = hr;
                        heartRateDisplay.textContent = `${languageText[currentLanguage].heartRate} ${currentHeartRate} BPM`;
                    } else if (sensorHeartRateDisplay) {
                        sensorHeartRateDisplay.textContent = `${languageText[currentLanguage].sensorHeartRate} Invalid`;
                    }
                } else if (sensorHeartRateDisplay) {
                    sensorHeartRateDisplay.textContent = `${languageText[currentLanguage].sensorHeartRate} No Data`;
                }
            })
            .catch(error => {
                console.error('Error fetching sensor heart rate:', error);
                if (sensorHeartRateDisplay) {
                    sensorHeartRateDisplay.textContent = `${languageText[currentLanguage].sensorHeartRate} Error`;
                }
            });
    }

    // Fetch sensor heart rate periodically (e.g., every 2 seconds)
    sensorInterval = setInterval(fetchSensorHeartRate, 2000);

    if (analyzeButton) {
        analyzeButton.addEventListener('click', () => {
            if (!recordedSymptoms.trim()) {
                alert(languageText[currentLanguage].pleaseSpeakSymptoms);
                return;
            }
            // We now rely on the currentHeartRate which is updated by the sensor data or manual input.

            issueDisplay.textContent = `${languageText[currentLanguage].potentialIssue} ${languageText[currentLanguage].analyzing}`;
            treatmentDisplay.textContent = `${languageText[currentLanguage].treatment} ${languageText[currentLanguage].analyzing}`;
            avoidDisplay.textContent = `${languageText[currentLanguage].thingsToAvoid} ${languageText[currentLanguage].analyzing}`;

            const dataToSend = {
                symptoms: recordedSymptoms,
                heartRate: currentHeartRate, // Use the latest heart rate (sensor or manual)
                language: currentLanguage
            };

            console.log('Sending data to backend for analysis:', dataToSend);

            fetch('http://localhost:5000/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Received analysis response:', data);
                const issueText = data.issue || languageText[currentLanguage].noSpecificIssue;
                const treatmentText = data.treatment || languageText[currentLanguage].noInformationProvided;
                const avoidText = data.avoid || languageText[currentLanguage].noSpecificAdvice;

                issueDisplay.textContent = `${languageText[currentLanguage].potentialIssue} ${issueText}`;
                treatmentDisplay.textContent = `${languageText[currentLanguage].treatment} ${treatmentText}`;
                avoidDisplay.textContent = `${languageText[currentLanguage].thingsToAvoid} ${avoidText}`;

                issueDisplay.dataset.value = data.issue || '';
                treatmentDisplay.dataset.value = data.treatment || '';
                avoidDisplay.dataset.value = data.avoid || '';

                // Speak the analysis immediately after receiving it
                const fullAnalysis = `${languageText[currentLanguage].potentialIssue} ${issueText}. ${languageText[currentLanguage].treatment} ${treatmentText}. ${languageText[currentLanguage].thingsToAvoid} ${avoidText}.`;
                speakAnalysis(fullAnalysis, currentLanguage);
            })
            .catch(error => {
                console.error('Error during analysis request:', error);
                issueDisplay.textContent = `${languageText[currentLanguage].potentialIssue} ${languageText[currentLanguage].errorDuringAnalysis}`;
                treatmentDisplay.textContent = `${languageText[currentLanguage].treatment} ${languageText[currentLanguage].errorDuringAnalysis}`;
                avoidDisplay.textContent = `${languageText[currentLanguage].thingsToAvoid} ${languageText[currentLanguage].errorDuringAnalysis}`;
            });
        });
    } else {
        console.warn('Analyze button not found in HTML.');
    }
});