# Image Gallery Web Application

A responsive web application for managing and displaying images with user authentication, built with Flask and vanilla JavaScript.

## Features

- **User Authentication**: Register and login system with password hashing
- **Image Upload**: Upload images with title, description, and tags
- **Responsive Grid**: Masonry-style layout that adapts to different screen sizes
- **Search & Filter**: Search by title/description and filter by tags
- **Image Preview**: Modal view for detailed image information
- **Edit & Delete**: Users can edit or delete their own images
- **Secure Storage**: Images stored securely with unique filenames
- **Ownership Control**: Users can only modify images they uploaded

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser and go to `http://localhost:5000`

4. Register a new account or login to start uploading and viewing images

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Upload Images**: Click "Upload Image" to add new images with details
3. **Browse Gallery**: View all images in a responsive grid layout
4. **Search**: Use the search bar to find images by title or description
5. **Filter**: Select tags from the dropdown to filter images
6. **Preview**: Click any image to view it in full size with details
7. **Edit**: Click the edit button (✏️) on your images to modify title, description, or tags
8. **Delete**: Click the delete button (🗑️) on your images to remove them permanently

## File Structure

- `app.py` - Main Flask application
- `templates/` - HTML templates
- `static/css/` - Stylesheets
- `static/js/` - JavaScript functionality
- `static/uploads/` - Uploaded images storage
- `database.db` - SQLite database (created automatically)

## Security Notes

- Change the `SECRET_KEY` in `app.py` for production use
- Images are stored with unique UUIDs to prevent conflicts
- User passwords are hashed using Werkzeug's security functions
- File upload validation ensures only image files are accepted