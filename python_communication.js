// Python Communication Module
// Handles file upload and communication with Flask backend

class PythonCommunication {
    constructor() {
        this.backendUrl = 'http://127.0.0.1:5000';
        this.initializeEventListeners();
        this.midsection_data = null;
        this.profile_data = null;
    }

    initializeEventListeners() {
        const fileForm = document.getElementById('fileForm_mid');
        if (fileForm) {
            fileForm.addEventListener('submit', (event) => this.handleFileUpload(event));
        }
        const fileForm2 = document.getElementById('fileForm_profile');
        if (fileForm2) {
            fileForm2.addEventListener('submit', (event) => this.handleFileUpload(event));
        }
        const fileForm3 = document.getElementById('fileForm_3d');
        if (fileForm3) {
            fileForm3.addEventListener('submit', (event) => this.handleFileUpload(event));
        }
    }

    handleFileUpload(event) {
        event.preventDefault();

        if (event.target.id === 'fileForm_mid') {

            const fileInput = document.getElementById('fileInput_mid');
            const file = fileInput.files[0];

            if (!file) {
                this.displayMessage('Please select a midsection drawing file.', 'error');
                return;
            }

            // Check if file is a JPG
            if (!this.isValidJPGFile(file)) {
                this.displayMessage('Please select a valid JPG file.', 'error');
                return;
            }

            this.uploadMidsectionFileToBackend(file);
        }

        if (event.target.id === 'fileForm_profile') {
            const fileInput = document.getElementById('fileInput_profile');
            const file = fileInput.files[0];

            if (!file) {
                this.displayMessage('Please select a profile drawing file.', 'error');
                return;
            }

            if (!this.isValidJPGFile(file)) {
                this.displayMessage('Please select a valid JPG file.', 'error');
                return;
            }

            this.uploadProfileFileToBackend(file);
        }   

        if (event.target.id === 'fileForm_3d') {
            this.upload3DModelFileToBackend();
        }
    }

    isValidJPGFile(file) {
        return file.type.match('image/jpeg') || 
               file.name.toLowerCase().endsWith('.jpg') || 
               file.name.toLowerCase().endsWith('.jpeg');
    }

    
    async upload3DModelFileToBackend() {
        try {
            // Get data from both midsection and profile forms
            const midsectionData = this.midsection_data;
            const profileData = this.profile_data;
            
            if (!midsectionData || !profileData) {
                this.displayMessage('Please upload both midsection and profile images before generating 3D model.', 'error');
                return;
            }
            
            // Create combined data object for 3D model generation
            const combinedData = {
                midsection: midsectionData,
                profile: profileData
            };
            
            console.log('Combined data for 3D model:', combinedData);
            
            // Call input3DModels with the combined data
            // profile.height is the length of the ship
            this.callInput3DModels(combinedData.midsection.width, combinedData.midsection.height, combinedData.profile.height, combinedData.midsection.mask_points, combinedData.profile.mask_points);
            
            this.displayMessage('3D model generation initiated with midsection and profile data.', 'success');
            
        } catch (error) {
            console.error('Error in 3D model generation:', error);
            this.displayMessage('Error generating 3D model: ' + error.message, 'error');
            
            // Check if backend is running
            this.checkBackendStatus();
        }
    }


    async uploadMidsectionFileToBackend(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            console.log('Uploading file:', file.name, 'Size:', file.size, 'bytes');

            const response = await fetch(`${this.backendUrl}/api/upload_midsection`, {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.text();
                    console.log('Error response body:', errorData);
                    
                    // Try to parse as JSON for better error message
                    try {
                        const errorJson = JSON.parse(errorData);
                        if (errorJson.message) {
                            errorMessage = errorJson.message;
                        }
                    } catch (e) {
                        errorMessage += ` - ${errorData}`;
                    }
                } catch (e) {
                    console.log('Could not read error response body');
                }
                
                // If backend fails, still show the image on canvas
                console.log('Backend failed, but displaying image on canvas anyway');
                this.updateCanvasWithImage(file);
                this.displayMessage(`Backend error: ${errorMessage}. Image displayed on canvas.`, 'error');
                return;
            }

            const data = await response.json();
            console.log('Success response:', data);
            this.displayImageInfo(data);
            
            // Check if we received base64 PNG data and update canvas
            if (data.mask_png_data) {
                this.updateCanvasWithBase64PNG(data.mask_png_data);
            } else {
                // Fallback to original image if no mask data
                this.updateCanvasWithImage(file);
            }
            
            // Call input3DModels with new dimensions and mask_points if available
            if (data.width && data.height) {
                this.midsection_data = data;
                //this.callInput3DModels(data.mask_width, data.mask_height, data.mask_points);
            }
            
        } catch (error) {
            console.error('Error details:', error);
            
            // Even if backend fails, try to display the image
            try {
                this.updateCanvasWithImage(file);
                this.displayMessage('Backend connection failed, but image is displayed on canvas. File size: ' + (file.size / 1024).toFixed(2) + ' KB', 'error');
            } catch (canvasError) {
                console.error('Canvas update also failed:', canvasError);
                this.displayMessage('Error processing image: ' + error.message, 'error');
            }
            
            // Check if backend is running
            this.checkBackendStatus();
        }
    }

    async uploadProfileFileToBackend(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            console.log('Uploading file:', file.name, 'Size:', file.size, 'bytes');

            const response = await fetch(`${this.backendUrl}/api/upload_profile`, {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                // Try to get error details from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.text();
                    console.log('Error response body:', errorData);
                    
                    // Try to parse as JSON for better error message
                    try {
                        const errorJson = JSON.parse(errorData);
                        if (errorJson.message) {
                            errorMessage = errorJson.message;
                        }
                    } catch (e) {
                        errorMessage += ` - ${errorData}`;
                    }
                } catch (e) {
                    console.log('Could not read error response body');
                }
                
                // If backend fails, still show the image on canvas
                console.log('Backend failed, but displaying image on canvas anyway');
                this.updateCanvasWithImage(file);
                this.displayMessage(`Backend error: ${errorMessage}. Image displayed on canvas.`, 'error');
                return;
            }

            const data = await response.json();
            console.log('Success response:', data);
            this.displayImageInfo(data);
            
            // Check if we received base64 PNG data and update canvas
            if (data.mask_png_data) {
                this.updateCanvasWithBase64PNG(data.mask_png_data);
            } else {
                // Fallback to original image if no mask data
                this.updateCanvasWithImage(file);
            }
            
            // Call input3DModels with new dimensions and mask_points if available
            if (data.width && data.height) {
                this.profile_data = data;
                //this.callInput3DModels(data.mask_width, data.mask_height, data.mask_points);
            }
            
        } catch (error) {
            console.error('Error details:', error);
            
            // Even if backend fails, try to display the image
            try {
                this.updateCanvasWithImage(file);
                this.displayMessage('Backend connection failed, but image is displayed on canvas. File size: ' + (file.size / 1024).toFixed(2) + ' KB', 'error');
            } catch (canvasError) {
                console.error('Canvas update also failed:', canvasError);
                this.displayMessage('Error processing image: ' + error.message, 'error');
            }
            
            // Check if backend is running
            this.checkBackendStatus();
        }
    }

    async checkBackendStatus() {
        try {
            const response = await fetch(`${this.backendUrl}/api/message`);
            if (response.ok) {
                console.log('Backend is running and accessible');
            } else {
                console.error('Backend responded with error status:', response.status);
            }
        } catch (error) {
            console.error('Backend connection failed. Make sure Flask server is running on port 5000');
            this.displayMessage('Backend server is not running. Please start the Flask server.', 'error');
        }
    }

    updateCanvasWithBase64PNG(base64Data) {
        const canvas = document.getElementById('the-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Check if canvas already has content
        if (typeof window.imagePages !== 'undefined' && window.imagePages.length > 0) {
            // Add current canvas content to pages if it's not empty
            if (typeof addCurrentCanvasToPages === 'function') {
                addCurrentCanvasToPages();
            }
        }

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate aspect ratio to fit canvas properly
            const maxWidth = 800; // Maximum width for display
            const maxHeight = 600; // Maximum height for display
            
            let { width, height } = img;
            
            // Scale down if image is too large
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
            }
            
            // Set canvas size
            canvas.width = width;
            canvas.height = height;
            
            // Clear canvas and draw the image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Add new image to pages
            if (typeof addImageToPages === 'function') {
                addImageToPages('base64', base64Data, width, height);
            }
            
            console.log('Base64 PNG image loaded and displayed on canvas');
        };

        img.onerror = () => {
            console.error('Error loading base64 PNG image');
            this.displayMessage('Error loading base64 PNG image to canvas', 'error');
        };

        // Set the base64 data as image source
        img.src = 'data:image/png;base64,' + base64Data;
    }

    updateCanvasWithImage(file) {
        const canvas = document.getElementById('the-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Check if canvas already has content
        if (typeof window.imagePages !== 'undefined' && window.imagePages.length > 0) {
            // Add current canvas content to pages if it's not empty
            if (typeof addCurrentCanvasToPages === 'function') {
                addCurrentCanvasToPages();
            }
        }

        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate aspect ratio to fit canvas properly
            const maxWidth = 800; // Maximum width for display
            const maxHeight = 600; // Maximum height for display
            
            let { width, height } = img;
            
            // Scale down if image is too large
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
            }
            
            // Set canvas size
            canvas.width = width;
            canvas.height = height;
            
            // Clear canvas and draw the image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Add new image to pages
            if (typeof addImageToPages === 'function') {
                addImageToPages('file', file, width, height);
            }
            
            console.log('Image loaded and displayed on canvas');
            
        };

        img.onerror = () => {
            console.error('Error loading image');
            this.displayMessage('Error loading image to canvas', 'error');
        };

        // Create object URL from file and load image
        const objectURL = URL.createObjectURL(file);
        img.src = objectURL;
    }

    displayImageInfo(data) {
        const messageElement = document.getElementById('fileResponseMessage');
        
        if (data.width && data.height) {
            messageElement.innerHTML = `
                <strong>Image Dimensions:</strong><br>
                Width: ${data.width} pixels<br>
                Height: ${data.height} pixels<br>
                <strong>File Size:</strong> ${data.file_size_kb || 'Unknown'} KB
                ${data.note ? '<br><em>' + data.note + '</em>' : ''}
            `;
            messageElement.className = 'success';
        } else if (data.message) {
            // If we have a message but no dimensions, show the message
            messageElement.textContent = data.message;
            messageElement.className = data.note ? 'error' : 'info';
        } else {
            // Fallback for incomplete data
            messageElement.textContent = 'Image uploaded but dimension information unavailable.';
            messageElement.className = 'info';
        }
    }

    displayMessage(message, type = 'info') {
        const messageElement = document.getElementById('fileResponseMessage');
        messageElement.textContent = message;
        messageElement.className = type;
    }

    // Method to test backend connection
    async testConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/api/message`);
            const data = await response.json();
            console.log('Backend connection test:', data.message);
            return true;
        } catch (error) {
            console.error('Backend connection failed:', error);
            return false;
        }
    }

    getFormData(formId, inputId) {
        const form = document.getElementById(formId);
        const input = document.getElementById(inputId);
        
        if (!form || !input || !input.files[0]) {
            return null;
        }
        
        const file = input.files[0];
        return {
            file: file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        };
    }



    callInput3DModels(width, height, shiplength, midsection_mask_points, profile_mask_points) {
        try {
            console.log('Calling input3DModels with combined data:', width, height, shiplength, midsection_mask_points, profile_mask_points);
            
            // Check if input3DModels function exists in global scope
            if (typeof window.input3DModels === 'function') {
                window.input3DModels(width, height, shiplength, midsection_mask_points, profile_mask_points);
                console.log('input3DModels called successfully with combined data');
            } else {
                console.log('input3DModels function not found in global scope');
                
                // Try to find it in the main module
                if (window.main && typeof window.main.input3DModels === 'function') {
                    window.main.input3DModels(width, height, shiplength, midsection_mask_points, profile_mask_points);
                    console.log('input3DModels called from main module with combined data');
                } else {
                    console.log('input3DModels not available');
                }
            }
        } catch (error) {
            console.error('Error calling input3DModels:', error);
        }
    }
}

// Initialize the communication module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.pythonComm = new PythonCommunication();
    
    // Test backend connection on startup
    window.pythonComm.testConnection();
}); 