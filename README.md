# Tandrima Nandy - Portfolio (Flask + SQLite)

## Run in VS Code
1. Open this folder in VS Code (File > Open Folder).
2. Open a terminal (Ctrl + `) and run:
   python -m venv venv
   venv\Scripts\activate          (Windows)   |   source venv/bin/activate   (Mac/Linux)
   pip install -r requirements.txt
   python app.py
3. Open http://127.0.0.1:5000

## Add your images
- static/images/profile.jpg            -> your portrait (shows "TN" until added)
- static/images/data-sense-ai.png      -> Data Sense AI screenshot
- static/images/symptom-sense-ai.png   -> Symptom Sense AI screenshot

## Notes
- portfolio.db is created automatically on first run (projects, skills, timeline, certificates, messages).
- Contact messages are saved in SQLite. View them at /admin/messages?key=change-me
  (set your own key: set ADMIN_KEY=yourkey before running).
- Zoom the universe with the +/- buttons or Ctrl + mouse wheel; drag empty space to pan.
- To change content, edit the lists at the top of app.py and delete portfolio.db, then rerun.
