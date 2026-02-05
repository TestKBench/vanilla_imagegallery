"""Image Gallery Web Application.

A Flask-based web application for managing and displaying images with user
authentication. Features include user registration/login, image upload with
metadata, search and filtering, and responsive gallery display.

Key features:
- User authentication with password hashing
- Image upload with title, description, and tags
- Search and filter functionality
- Responsive masonry-style gallery layout
- User ownership controls for editing/deleting images
- RESTful API endpoints for frontend interaction
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension.
    
    Args:
        filename (str): The name of the file to check.
        
    Returns:
        bool: True if the file extension is allowed, False otherwise.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_db():
    """Initialize the SQLite database with required tables.
    
    Creates the users and images tables if they don't exist.
    Users table stores authentication information, images table stores
    image metadata with foreign key relationship to users.
    """
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Images table
    c.execute('''CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        uploaded_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
    )''')
    
    conn.commit()
    conn.close()

@app.before_request
def create_tables():
    """Ensure database tables are created before handling any request.
    
    Uses a function attribute to track initialization state and only
    runs the database initialization once per application startup.
    """
    if not hasattr(create_tables, 'initialized'):
        init_db()
        create_tables.initialized = True

def login_required(f):
    """Decorator to require user authentication for protected routes.
    
    Args:
        f (function): The view function to protect.
        
    Returns:
        function: The decorated function that checks for user authentication.
    """
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
@login_required
def index():
    """Render the main gallery page.
    
    Returns:
        str: Rendered HTML template for the image gallery.
    """
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login authentication.
    
    GET: Display the login form.
    POST: Validate credentials and create user session.
    
    Returns:
        str: Rendered login template or redirect to index on success.
    """
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('SELECT id, password_hash FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()
        
        if user and check_password_hash(user[1], password):
            session['user_id'] = user[0]
            session['username'] = username
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration.
    
    GET: Display the registration form.
    POST: Validate input, create new user account with hashed password.
    
    Returns:
        str: Rendered registration template or redirect to login on success.
    """
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if len(username) < 3 or len(password) < 6:
            flash('Username must be at least 3 characters and password at least 6 characters')
            return render_template('register.html')
        
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        try:
            password_hash = generate_password_hash(password)
            c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', 
                     (username, password_hash))
            conn.commit()
            flash('Registration successful! Please log in.')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username already exists')
        finally:
            conn.close()
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    """Clear user session and redirect to login page.
    
    Returns:
        werkzeug.wrappers.Response: Redirect response to login page.
    """
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/images')
@login_required
def get_images():
    """Retrieve images with optional search and tag filtering.
    
    Query parameters:
        search (str, optional): Search term for title or description.
        tag (str, optional): Tag to filter by.
    
    Returns:
        flask.Response: JSON response containing list of image objects.
    """
    search = request.args.get('search', '')
    tag_filter = request.args.get('tag', '')
    
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    query = '''SELECT id, filename, title, description, tags, uploaded_by, created_at 
               FROM images WHERE 1=1'''
    params = []
    
    if search:
        query += ' AND (title LIKE ? OR description LIKE ?)'
        params.extend([f'%{search}%', f'%{search}%'])
    
    if tag_filter:
        query += ' AND tags LIKE ?'
        params.append(f'%{tag_filter}%')
    
    query += ' ORDER BY created_at DESC'
    
    c.execute(query, params)
    images = c.fetchall()
    conn.close()
    
    return jsonify([{
        'id': img[0],
        'filename': img[1],
        'title': img[2],
        'description': img[3],
        'tags': [tag.strip() for tag in img[4].split(',') if tag.strip()] if img[4] else [],
        'uploaded_by': img[5],
        'created_at': img[6]
    } for img in images])

@app.route('/upload', methods=['POST'])
@login_required
def upload_image():
    """Handle image upload with metadata.
    
    Validates file type, generates unique filename, saves file to disk,
    and stores metadata in database. Tags are processed and normalized.
    
    Form data:
        file: Image file to upload.
        title (str): Required title for the image.
        description (str, optional): Image description.
        tags (str, optional): Comma-separated list of tags.
    
    Returns:
        flask.Response: JSON response with success/error status.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    tags = request.form.get('tags', '')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not title:
        return jsonify({'error': 'Title is required'}), 400
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process tags - clean and normalize
        if tags:
            processed_tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
            tags = ','.join(processed_tags)
        
        # Save to database
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''INSERT INTO images (filename, title, description, tags, uploaded_by)
                     VALUES (?, ?, ?, ?, ?)''',
                  (filename, title, description, tags, session['user_id']))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Image uploaded successfully'})
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/user')
@login_required
def get_current_user():
    """Get current authenticated user information.
    
    Returns:
        flask.Response: JSON response with user ID and username.
    """
    return jsonify({
        'id': session['user_id'],
        'username': session['username']
    })

@app.route('/api/tags')
@login_required
def get_tags():
    """Retrieve all unique tags from uploaded images.
    
    Extracts tags from comma-separated tag strings in the database,
    deduplicates them, and returns a sorted list.
    
    Returns:
        flask.Response: JSON response with sorted list of unique tags.
    """
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT id FROM images')
    image_ids = c.fetchall()
    
    # N+1 problem: query each image individually
    all_tags = set()
    for image_id in image_ids:
        c.execute('SELECT tags FROM images WHERE id = ?', (image_id[0],))
        row = c.fetchone()
        if row and row[0]:
            tags = [tag.strip() for tag in row[0].split(',')]
            all_tags.update(tags)
    
    conn.close()
    return jsonify(sorted(list(all_tags)))

@app.route('/api/images/<int:image_id>', methods=['GET'])
@login_required
def get_image(image_id):
    """Retrieve a specific image by ID.
    
    Args:
        image_id (int): The ID of the image to retrieve.
    
    Returns:
        flask.Response: JSON response with image data or 404 if not found.
    """
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''SELECT id, filename, title, description, tags, uploaded_by, created_at 
                 FROM images WHERE id = ?''', (image_id,))
    image = c.fetchone()
    conn.close()
    
    if not image:
        return jsonify({'error': 'Image not found'}), 404
    
    return jsonify({
        'id': image[0],
        'filename': image[1],
        'title': image[2],
        'description': image[3],
        'tags': [tag.strip() for tag in image[4].split(',') if tag.strip()] if image[4] else [],
        'uploaded_by': image[5],
        'created_at': image[6]
    })

@app.route('/api/images/<int:image_id>', methods=['PUT'])
@login_required
def update_image(image_id):
    """Update image metadata (title, description, tags).
    
    Only allows users to update images they uploaded. Validates ownership
    and processes tags by cleaning and normalizing them.
    
    Args:
        image_id (int): The ID of the image to update.
    
    JSON payload:
        title (str): Required new title for the image.
        description (str, optional): New description.
        tags (str, optional): Comma-separated list of new tags.
    
    Returns:
        flask.Response: JSON response with success/error status.
    """
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # Check if image exists and user owns it
    c.execute('SELECT uploaded_by FROM images WHERE id = ?', (image_id,))
    image = c.fetchone()
    
    if not image:
        conn.close()
        return jsonify({'error': 'Image not found'}), 404
    
    if image[0] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get update data
    data = request.get_json()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    tags = data.get('tags', '')
    
    if not title:
        conn.close()
        return jsonify({'error': 'Title is required'}), 400
    
    # Process tags - clean and normalize
    if tags:
        processed_tags = [tag.strip() for tag in tags.split(',') if tag.strip()]
        tags = ','.join(processed_tags)
    
    # Update image
    c.execute('''UPDATE images SET title = ?, description = ?, tags = ? 
                 WHERE id = ?''', (title, description, tags, image_id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Image updated successfully'})

@app.route('/api/images/<int:image_id>', methods=['DELETE'])
@login_required
def delete_image(image_id):
    """Delete an image and its associated file.
    
    Only allows users to delete images they uploaded. Removes both the
    database record and the physical file from the filesystem.
    
    Args:
        image_id (int): The ID of the image to delete.
    
    Returns:
        flask.Response: JSON response with success/error status.
    """
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    # Get image info and check ownership
    c.execute('SELECT filename, uploaded_by FROM images WHERE id = ?', (image_id,))
    image = c.fetchone()
    
    if not image:
        conn.close()
        return jsonify({'error': 'Image not found'}), 404
    
    if image[1] != session['user_id']:
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Delete from database
    c.execute('DELETE FROM images WHERE id = ?', (image_id,))
    conn.commit()
    conn.close()
    
    # Delete file from filesystem
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], image[0])
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    return jsonify({'success': True, 'message': 'Image deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True)