import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import (
    LoginManager,
    UserMixin,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

from analyzer import analyze_resume, extract_resume_text


BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
UPLOAD_DIR = BASE_DIR / "static" / "uploads"

INSTANCE_DIR.mkdir(exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


app = Flask(__name__)

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "resumeiq-local-development-key",
)
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{INSTANCE_DIR / 'resume_screener.db'}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

db = SQLAlchemy(app)

login_manager = LoginManager(app)
login_manager.login_view = "login"
login_manager.login_message = "Please log in to continue."
login_manager.login_message_category = "info"

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)

    full_name = db.Column(
        db.String(120),
        nullable=False,
    )

    email = db.Column(
        db.String(180),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False,
    )
    profile_image = db.Column(db.String(255), nullable=True)
    created_at = db.Column(
        db.DateTime,
        default=utc_now,
        nullable=False,
    )

    analyses = db.relationship(
        "ResumeAnalysis",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan",
    )


class ResumeAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    original_filename = db.Column(
        db.String(255),
        nullable=False,
    )

    stored_filename = db.Column(
        db.String(255),
        nullable=False,
    )

    score = db.Column(
        db.Integer,
        nullable=False,
        default=0,
    )

    job_match = db.Column(
        db.Integer,
        nullable=False,
        default=0,
    )

    word_count = db.Column(
        db.Integer,
        nullable=False,
        default=0,
    )

    keyword_count = db.Column(
        db.Integer,
        nullable=False,
        default=0,
    )

    detected_skills = db.Column(
        db.Text,
        nullable=False,
        default="[]",
    )

    missing_skills = db.Column(
        db.Text,
        nullable=False,
        default="[]",
    )

    strengths = db.Column(
        db.Text,
        nullable=False,
        default="[]",
    )

    improvements = db.Column(
        db.Text,
        nullable=False,
        default="[]",
    )

    job_description = db.Column(
        db.Text,
        nullable=True,
    )

    created_at = db.Column(
        db.DateTime,
        default=utc_now,
        nullable=False,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False,
    )

    def get_list(self, field_name):
        try:
            value = getattr(self, field_name)
            return json.loads(value)
        except (AttributeError, TypeError, json.JSONDecodeError):
            return []


@login_manager.user_loader
def load_user(user_id):
    try:
        return db.session.get(User, int(user_id))
    except (TypeError, ValueError):
        return None


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


@app.context_processor
def inject_global_values():
    return {
        "current_year": datetime.now(timezone.utc).year,
    }


@app.errorhandler(404)
def page_not_found(_error):
    return render_template("404.html"), 404


@app.errorhandler(413)
def file_too_large(_error):
    flash(
        "The selected file is too large. Maximum size is 10 MB.",
        "error",
    )
    return redirect(url_for("analyzer_page"))


@app.route("/favicon.ico")
def favicon():
    return "", 204


@app.route("/")
def home():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    return render_template("index.html")


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        full_name = request.form.get("full_name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if len(full_name) < 2:
            flash("Please enter your full name.", "error")

        elif "@" not in email or "." not in email:
            flash("Please enter a valid email address.", "error")

        elif len(password) < 8:
            flash(
                "Password must contain at least 8 characters.",
                "error",
            )

        elif password != confirm_password:
            flash("Passwords do not match.", "error")

        elif User.query.filter_by(email=email).first():
            flash(
                "An account already exists with this email.",
                "error",
            )

        else:
            new_user = User(
                full_name=full_name,
                email=email,
                password_hash=generate_password_hash(password),
            )

            db.session.add(new_user)
            db.session.commit()

            login_user(new_user)

            flash(
                "Your account has been created successfully.",
                "success",
            )

            return redirect(url_for("dashboard"))

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        remember = request.form.get("remember") == "on"

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(
            user.password_hash,
            password,
        ):
            flash("Incorrect email address or password.", "error")

        else:
            login_user(
                user,
                remember=remember,
            )

            first_name = user.full_name.split()[0]

            flash(
                f"Welcome back, {first_name}!",
                "success",
            )

            return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()

    flash(
        "You have been logged out.",
        "info",
    )

    return redirect(url_for("home"))


@app.route("/dashboard")
@login_required
def dashboard():
    analyses = (
        ResumeAnalysis.query
        .filter_by(user_id=current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )

    total_analyses = len(analyses)

    average_score = (
        round(
            sum(item.score for item in analyses)
            / total_analyses
        )
        if total_analyses
        else 0
    )

    best_score = max(
        (item.score for item in analyses),
        default=0,
    )

    skill_frequency = {}

    for analysis in analyses:
        for skill in analysis.get_list("detected_skills"):
            skill_frequency[skill] = (
                skill_frequency.get(skill, 0) + 1
            )

    top_skills = sorted(
        skill_frequency.items(),
        key=lambda item: item[1],
        reverse=True,
    )[:6]

    return render_template(
        "dashboard.html",
        recent_analyses=analyses[:5],
        total_analyses=total_analyses,
        average_score=average_score,
        best_score=best_score,
        top_skills=top_skills,
    )


@app.route("/analyzer", methods=["GET", "POST"])
@login_required
def analyzer_page():
    if request.method == "POST":
        uploaded_file = request.files.get("resume")
        job_description = request.form.get(
            "job_description",
            "",
        ).strip()

        if not uploaded_file or not uploaded_file.filename:
            flash("Please select a resume file.", "error")
            return redirect(url_for("analyzer_page"))

        if not allowed_file(uploaded_file.filename):
            flash(
                "Only PDF, DOCX and TXT files are supported.",
                "error",
            )
            return redirect(url_for("analyzer_page"))

        original_filename = secure_filename(
            uploaded_file.filename
        )

        extension = original_filename.rsplit(
            ".",
            1,
        )[1].lower()

        stored_filename = (
            f"{uuid.uuid4().hex}_{original_filename}"
        )

        file_path = UPLOAD_DIR / stored_filename

        uploaded_file.save(file_path)

        try:
            resume_text = extract_resume_text(
                file_path,
                extension,
            )

            if len(resume_text.strip()) < 30:
                raise ValueError(
                    "The uploaded resume does not contain enough readable text."
                )

            result = analyze_resume(
                resume_text,
                job_description,
            )

            analysis = ResumeAnalysis(
                original_filename=original_filename,
                stored_filename=stored_filename,
                score=result["score"],
                job_match=result["job_match"],
                word_count=result["word_count"],
                keyword_count=result["keyword_count"],
                detected_skills=json.dumps(
                    result["detected_skills"]
                ),
                missing_skills=json.dumps(
                    result["missing_skills"]
                ),
                strengths=json.dumps(
                    result["strengths"]
                ),
                improvements=json.dumps(
                    result["improvements"]
                ),
                job_description=job_description or None,
                user_id=current_user.id,
            )

            db.session.add(analysis)
            db.session.commit()

            flash(
                "Resume analysis completed successfully.",
                "success",
            )

            return redirect(
                url_for(
                    "analysis_result",
                    analysis_id=analysis.id,
                )
            )

        except Exception as error:
            if file_path.exists():
                file_path.unlink()

            flash(
                str(error)
                or "The resume could not be analyzed.",
                "error",
            )

    return render_template("analyzer.html")


@app.route("/results/<int:analysis_id>")
@login_required
def analysis_result(analysis_id):
    analysis = (
        ResumeAnalysis.query
        .filter_by(
            id=analysis_id,
            user_id=current_user.id,
        )
        .first_or_404()
    )

    return render_template(
        "results.html",
        analysis=analysis,
        detected_skills=analysis.get_list(
            "detected_skills"
        ),
        missing_skills=analysis.get_list(
            "missing_skills"
        ),
        strengths=analysis.get_list("strengths"),
        improvements=analysis.get_list("improvements"),
    )


@app.route("/history")
@login_required
def history():
    analyses = (
        ResumeAnalysis.query
        .filter_by(user_id=current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )

    return render_template(
        "history.html",
        analyses=analyses,
    )


@app.route(
    "/history/<int:analysis_id>/delete",
    methods=["POST"],
)
@login_required
def delete_analysis(analysis_id):
    analysis = (
        ResumeAnalysis.query
        .filter_by(
            id=analysis_id,
            user_id=current_user.id,
        )
        .first_or_404()
    )

    file_path = UPLOAD_DIR / analysis.stored_filename

    if file_path.exists():
        file_path.unlink()

    db.session.delete(analysis)
    db.session.commit()

    flash(
        "The analysis has been deleted.",
        "success",
    )

    return redirect(url_for("history"))


ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def allowed_image(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS
    )


@app.route("/profile/avatar", methods=["POST"])
@login_required
def update_avatar():
    uploaded_file = request.files.get("profile_image")

    if not uploaded_file or not uploaded_file.filename:
        flash("Please select an image to upload.", "error")
        return redirect(url_for("profile"))

    if not allowed_image(uploaded_file.filename):
        flash("Unsupported file format. Please upload a PNG, JPG or WEBP image.", "error")
        return redirect(url_for("profile"))

    original_filename = secure_filename(uploaded_file.filename)
    extension = original_filename.rsplit(".", 1)[1].lower()
    stored_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex}.{extension}"
    file_path = UPLOAD_DIR / stored_filename

    uploaded_file.save(file_path)

    if current_user.profile_image:
        old_path = UPLOAD_DIR / current_user.profile_image
        if old_path.exists():
            old_path.unlink()

    current_user.profile_image = stored_filename
    db.session.commit()

    flash("Profile picture updated successfully.", "success")
    return redirect(url_for("profile"))


@app.route("/profile", methods=["GET", "POST"])
@login_required
def profile():
    if request.method == "POST":
        full_name = request.form.get(
            "full_name",
            "",
        ).strip()

        if len(full_name) < 2:
            flash("Please enter a valid name.", "error")

        else:
            current_user.full_name = full_name
            db.session.commit()

            flash(
                "Profile updated successfully.",
                "success",
            )

            return redirect(url_for("profile"))

    return render_template("profile.html")


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)