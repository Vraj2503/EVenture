import os
import cv2
import time
import base64
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}
SIMILARITY_THRESHOLD = 0.55

# Create uploads folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

def save_base64_image(base64_string, filename):
    """Saves a base64 encoded image to the upload folder."""
    try:
        if base64_string.startswith('data:image'):
            # Extract the base64 data part
            base64_data = base64_string.split(',')[1]
        else:
            base64_data = base64_string
            
        image_data = base64.b64decode(base64_data)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        return file_path, None
    except Exception as e:
        return None, str(e)

def extract_face(image_path):
    """Detects and extracts the face from an image."""
    face_cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(face_cascade_path)
    
    image = cv2.imread(image_path)
    if image is None:
        return None, "Could not read image"
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))
    
    if len(faces) == 0:
        return None, "No face detected in the image"
    
    # Extract the first detected face
    x, y, w, h = faces[0]
    face = image[y:y+h, x:x+w]
    
    # Save the cropped face
    extracted_face_path = image_path.replace(".", "_cropped.")
    cv2.imwrite(extracted_face_path, face)
    
    return extracted_face_path, None

def match_faces(license_img_path, selfie_img_path):
    try:
        # Extract face from the driving license
        license_face, error = extract_face(license_img_path)
        
        if license_face is None:
            return {"verified": False, "error": f"License image error: {error}"}
        
        # Extract face from the selfie
        selfie_face, error = extract_face(selfie_img_path)
        
        if selfie_face is None:
            return {"verified": False, "error": f"Selfie image error: {error}"}
        
        # Perform face verification
        result = DeepFace.verify(license_face, selfie_face, model_name="Facenet")
        similarity_score = result["distance"]
        
        # Check if the similarity score is within the threshold
        if similarity_score >= SIMILARITY_THRESHOLD:
            return {
                "verified": True, 
                "similarity_score": float(similarity_score)
            }
        else:
            return {
                "verified": False, 
                "error": "Face verification failed",
                "similarity_score": float(similarity_score)
            }
    
    except Exception as e:
        return {"verified": False, "error": f"Processing error: {str(e)}"}

@app.route('/verify', methods=['POST'])
def verify():
    try:
        # Check if this is a JSON request with base64 encoded images
        if not request.is_json:
            return jsonify({"verified": False, "error": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        # Check if required fields are present
        if 'userId' not in data or 'license_base64' not in data or 'selfie_base64' not in data:
            return jsonify({"verified": False, "error": "Missing required fields"}), 400
        
        # Generate unique filenames
        user_id = data['userId']
        unique_id = str(uuid.uuid4())
        
        license_filename = f"{user_id}_{unique_id}_license.png"
        selfie_filename = f"{user_id}_{unique_id}_selfie.png"
        
        # Save base64 images to files
        license_path, license_error = save_base64_image(data['license_base64'], license_filename)
        if license_error:
            return jsonify({"verified": False, "error": f"License image error: {license_error}"}), 400
        
        selfie_path, selfie_error = save_base64_image(data['selfie_base64'], selfie_filename)
        if selfie_error:
            return jsonify({"verified": False, "error": f"Selfie image error: {selfie_error}"}), 400
        
        # Match the faces
        result = match_faces(license_path, selfie_path)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"verified": False, "error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)