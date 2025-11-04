const express = require('express');
const router = express.Router();
const axios = require('axios');

// Chatbot endpoint
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      // Return fallback response if API key not configured
      const fallbackResponse = getFallbackResponse(message);
      return res.json({
        success: true,
        response: fallbackResponse
      });
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for DeepGuardAI, a deepfake detection platform. Help users understand deepfakes, how to use the platform, and interpret their results. Be concise and informative.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    res.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    
    // Return fallback response on error
    const fallbackResponse = getFallbackResponse(req.body.message);
    res.json({
      success: true,
      response: fallbackResponse
    });
  }
});

// Fallback responses for common questions
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('deepfake') && lowerMessage.includes('what')) {
    return 'A deepfake is a synthetic media where a person\'s likeness is replaced with someone else\'s using AI. Our platform uses advanced CNN and LSTM models to detect these manipulations by analyzing facial features, lighting consistency, and temporal patterns.';
  }
  
  if (lowerMessage.includes('how') && (lowerMessage.includes('work') || lowerMessage.includes('detect'))) {
    return 'Our AI model analyzes your video frame-by-frame, detecting faces and examining spatial features with CNN and temporal patterns with LSTM. It looks for inconsistencies in lighting, eye movements, facial expressions, and other telltale signs of manipulation.';
  }
  
  if (lowerMessage.includes('upload') || lowerMessage.includes('use')) {
    return 'To use DeepGuardAI: 1) Register/Login to your account, 2) Go to the Upload page, 3) Select your video file, 4) Click upload and wait for analysis, 5) View your detailed results and download the report. The process typically takes a few minutes.';
  }
  
  if (lowerMessage.includes('confidence') || lowerMessage.includes('score')) {
    return 'The confidence score represents how certain our AI model is about its prediction. A score closer to 100% indicates higher confidence. Scores above 80% are generally considered reliable, but always consider the anomalies detected as well.';
  }
  
  if (lowerMessage.includes('anomal')) {
    return 'Anomalies are specific irregularities detected in the video, such as lighting inconsistencies, unnatural eye movements, facial feature mismatches, or temporal discontinuities. These help explain why a video was flagged as potentially fake.';
  }
  
  if (lowerMessage.includes('accurate') || lowerMessage.includes('reliable')) {
    return 'Our AI model is trained on thousands of real and fake videos, achieving high accuracy. However, no system is perfect. We recommend using our results as one factor in verifying content authenticity, along with source verification and critical thinking.';
  }
  
  if (lowerMessage.includes('report')) {
    return 'After analysis, you can download a detailed PDF report containing the detection results, confidence score, identified anomalies, and recommendations. This report can be used for documentation or sharing with others.';
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'Hello! I\'m the DeepGuardAI assistant. I can help you understand deepfakes, guide you through using our platform, and answer questions about your analysis results. What would you like to know?';
  }

  return 'I\'m here to help you with DeepGuardAI! You can ask me about: how deepfake detection works, how to upload and analyze videos, understanding your results, confidence scores, anomalies, or general questions about deepfakes. What would you like to know?';
}

module.exports = router;
