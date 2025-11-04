const { spawn } = require('child_process');
const path = require('path');

/**
 * Run Python deepfake detection script
 * @param {string} videoPath - Path to the video file
 * @returns {Promise} - Promise resolving to analysis result
 */
const runDeepfakeDetection = (videoPath) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../../ai_model/detect_deepfake.py');
    const pythonProcess = spawn('python', [pythonScript, videoPath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', errorString);
        reject(new Error(`Python script exited with code ${code}: ${errorString}`));
        return;
      }

      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        console.error('Failed to parse Python output:', dataString);
        reject(new Error('Failed to parse detection result'));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
};

module.exports = {
  runDeepfakeDetection
};
