"""Tandrima Nandy - Portfolio backend (Flask + SQLite).
Run:  python app.py   ->  http://127.0.0.1:5000
"""
import os, re, sqlite3
from flask import Flask, render_template, request, jsonify, g, abort

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, "portfolio.db")
ADMIN_KEY = os.environ.get("ADMIN_KEY", "change-me")  # used for /admin/messages
app = Flask(__name__)

SCHEMA = """
CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY, name TEXT, description TEXT,
  tech TEXT, features TEXT, live_url TEXT, github_url TEXT, image TEXT, sort INTEGER);
CREATE TABLE IF NOT EXISTS skills(id INTEGER PRIMARY KEY, category TEXT, name TEXT, description TEXT);
CREATE TABLE IF NOT EXISTS timeline(id INTEGER PRIMARY KEY, kind TEXT, title TEXT, place TEXT,
  period TEXT, score TEXT, points TEXT, sort INTEGER);
CREATE TABLE IF NOT EXISTS certificates(id INTEGER PRIMARY KEY, title TEXT, issuer TEXT, kind TEXT);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, name TEXT, email TEXT, message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);
"""

# Lists are stored as "a|b|c" strings.
PROJECTS = [
    ("Data Sense AI",
     "An AI-powered platform that automatically analyzes CSV, PDF, and Excel datasets. It cleans data, generates insights, creates interactive visualizations, and includes an AI chatbot to answer questions.",
     "Python|Flask|SQLite|Pandas|NumPy|Matplotlib|Plotly|HTML|CSS",
     "AI Analysis|Dashboard|Data Cleaning|Visualization|Chatbot",
     "https://datasensei-iota.vercel.app/login", "https://github.com/Tandrimanandy/Data_sense_ai",
     "images/data-sense-ai.png", 1),
    ("Symptom Sense AI",
     "An AI healthcare application that analyzes patient symptoms, recommends the appropriate specialist, and automates appointment booking for hospitals and clinics.",
     "Python|Flask|HTML|CSS|JavaScript|SQLite|NLP|Pandas|Plotly",
     "Symptom Analysis|Specialist Recommendation|Appointment Booking|Analytics",
     "https://elite-hit.vercel.app/login", "https://github.com/Tandrimanandy/Elite--hit",
     "images/symptom-sense-ai.png", 2),
]
SKILLS = [
    ("Programming", "Python", "My strongest language: web apps, data work, AI and NLP."),
    ("Web", "HTML", "Semantic, accessible page structure."),
    ("Web", "CSS", "Responsive layouts, animations, glassmorphism."),
    ("Web", "JavaScript", "Interactive front-end behaviour."),
    ("Web", "Flask", "Backend APIs and full web apps in Python."),
    ("Database", "SQLite", "Lightweight relational DB used in my Flask projects."),
    ("Database", "Oracle", "Relational database used during my coursework."),
    ("Data & AI", "Pandas", "Data cleaning and analysis."),
    ("Data & AI", "NumPy", "Numerical computing."),
    ("Data & AI", "Matplotlib", "Static charts and plots."),
    ("Data & AI", "Plotly", "Interactive visualizations."),
    ("Data & AI", "NLP", "Text analysis in my healthcare and chatbot projects."),
    ("Data & AI", "Data Mining", "Finding patterns in datasets."),
    ("Cloud & Big Data", "AWS (S3, EC2)", "Storage and compute on AWS."),
    ("Cloud & Big Data", "Cloud Computing", "Cloud fundamentals and deployment."),
    ("Cloud & Big Data", "Big Data", "Large-scale data concepts from my BCA and MCA."),
    ("Cloud & Big Data", "Networking", "Networking fundamentals."),
    ("Apps & Tools", "Kivy / KivyMD", "Cross-platform Python app UIs."),
    ("Apps & Tools", "Jupyter Notebook", "Interactive data exploration."),
    ("Apps & Tools", "Anaconda", "Python environment management."),
    ("Apps & Tools", "Excel", "Spreadsheet analysis."),
]
TIMELINE = [
    ("experience", "Web Developer Intern", "Interns Elite, Bangalore", "1 Feb 2023 - 31 Mar 2023", "",
     "Developed backend functionality using Flask|Built the frontend with HTML, CSS and JavaScript|Used SQLite as the database|Built an NLP and Flask-based project and wrote documentation in MS Office, leading to project renewals|Solved major backend issues by breaking the Flask code into smaller modules|Designed the UI/UX and implemented AI features", 1),
    ("education", "Master of Computer Applications (MCA)", "Techno India University", "2024 - 2026", "CGPA 9.09 (top 5% of cohort)",
     "Python|SQL|Flask|Data Engineering", 1),
    ("education", "Bachelor of Computer Applications (BCA)", "Techno India University", "2021 - 2024", "CGPA 8.69 (Bronze Medallist, 2024 batch)",
     "HTML|Big Data|Cloud Computing|Networking", 2),
]
CERTS = [
    ("Claude Code in Action", "Anthropic", "Certification"),
    ("Data Engineering", "AICTE Edu Skills", "Certification"),
    ("SAP S/4 HANA Development", "Techno India University", "Certification"),
    ("TATA Gen AI Data Analysis", "TATA & Forage", "Certification"),
    ("Gen AI Data Analysis", "Anudip Foundation", "Certification"),
    ("Best Team Lead Award", "Technothon 2025", "Achievement"),
    ("3rd Position in BCA (Bronze Medal)", "Techno India University, 2024", "Achievement"),
]


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_):
    d = g.pop("db", None)
    if d:
        d.close()


def init_db():
    con = sqlite3.connect(DB_PATH)
    con.executescript(SCHEMA)
    if not con.execute("SELECT 1 FROM projects").fetchone():
        con.executemany("INSERT INTO projects(name,description,tech,features,live_url,github_url,image,sort) VALUES(?,?,?,?,?,?,?,?)", PROJECTS)
        con.executemany("INSERT INTO skills(category,name,description) VALUES(?,?,?)", SKILLS)
        con.executemany("INSERT INTO timeline(kind,title,place,period,score,points,sort) VALUES(?,?,?,?,?,?,?)", TIMELINE)
        con.executemany("INSERT INTO certificates(title,issuer,kind) VALUES(?,?,?)", CERTS)
        con.commit()
    con.close()


def gallery(name):
    """Screenshots = every image inside static/images/<project-name-slug>/ (sorted by file name)."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    folder = os.path.join(BASE, "static", "images", slug)
    if not os.path.isdir(folder):
        return []
    files = sorted(f for f in os.listdir(folder) if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")))
    return [{"src": f"images/{slug}/{f}",
             "cap": re.sub(r"^\d+-", "", os.path.splitext(f)[0]).replace("-", " ").capitalize()} for f in files]


@app.route("/")
def index():
    db = get_db()
    skills = {}
    for s in db.execute("SELECT * FROM skills ORDER BY id"):
        skills.setdefault(s["category"], []).append(s)
    return render_template(
        "index.html",
        projects=[dict(r, gallery=gallery(r["name"])) for r in db.execute("SELECT * FROM projects ORDER BY sort")],
        skills=skills,
        experience=db.execute("SELECT * FROM timeline WHERE kind='experience' ORDER BY sort").fetchall(),
        education=db.execute("SELECT * FROM timeline WHERE kind='education' ORDER BY sort").fetchall(),
        certs=db.execute("SELECT * FROM certificates ORDER BY id").fetchall(),
    )


@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    msg = (data.get("message") or "").strip()
    if not name or not msg or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify(ok=False, error="Enter your name, a valid email and a message."), 400
    if len(name) > 100 or len(email) > 150 or len(msg) > 2000:
        return jsonify(ok=False, error="One of the fields is too long."), 400
    db = get_db()
    db.execute("INSERT INTO messages(name,email,message) VALUES(?,?,?)", (name, email, msg))
    db.commit()
    return jsonify(ok=True)


@app.route("/admin/messages")
def admin_messages():
    """View saved messages: /admin/messages?key=change-me"""
    if request.args.get("key") != ADMIN_KEY:
        abort(403)
    rows = get_db().execute("SELECT * FROM messages ORDER BY id DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@app.template_filter("split")
def split_filter(v):
    return [x for x in (v or "").split("|") if x]


init_db()

if __name__ == "__main__":
    app.run(debug=True)
