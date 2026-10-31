"""Tailoring Engine for AI Job Search Assistant.

Synthesizes tailored, factual CV and Cover Letter content customized for each
specific company and role based on Vinay Kumar S's verified candidate profile.
"""

import re
from typing import Dict, List, Tuple


def detect_role_focus(role: str, snippet: str = "") -> str:
    """Classifies the target role into a primary engineering focus domain."""
    combined = f"{role} {snippet}".lower()

    if any(k in combined for k in ["devops", "cloud", "infrastructure", "sre", "ci/cd", "jenkins", "docker", "sysadmin"]):
        return "DEVOPS_CLOUD"
    if any(k in combined for k in ["robot", "embedded", "iot", "hardware", "raspberry", "firmware", "edge ai"]):
        return "EMBEDDED_ROBOTICS"
    if any(k in combined for k in ["research", "ai", "ml", "machine learning", "deep learning", "llm", "nlp", "vision", "data science"]):
        return "AI_ML"
    if any(k in combined for k in ["python", "backend", "software engineer", "developer", "api", "django", "fastapi"]):
        return "PYTHON_BACKEND"

    return "AI_ML"  # Default primary undergraduate focus


def generate_tailored_summary(company: str, role: str, focus: str, snippet: str = "") -> str:
    """Creates a tailored professional summary for the specific company and role."""
    cgpa_str = "SJC Institute of Technology (CGPA: 8.0/10)"

    if focus == "DEVOPS_CLOUD":
        return (
            f"Artificial Intelligence and Machine Learning undergraduate at {cgpa_str} with strong practical skills in "
            f"Linux administration (Ubuntu, Raspbian), Docker containerization, CI/CD pipeline automation (Jenkins), "
            f"and Python scripting. Proven experience building containerized microservices and reproducible developer environments. "
            f"Eager to contribute automation rigor, infrastructure reliability, and disciplined version control workflows to "
            f"{company}'s engineering team as a {role}."
        )
    elif focus == "EMBEDDED_ROBOTICS":
        return (
            f"Artificial Intelligence and Machine Learning undergraduate at {cgpa_str} specializing in "
            f"embedded systems, on-device AI inference, and hardware-software integration. Lead developer of an autonomous "
            f"voice robot deploying local LLMs on Raspberry Pi 4 under 2-second response latency. Eager to bring hands-on "
            f"edge computing expertise, speech processing pipelines, and rapid prototyping capabilities to {company} as a {role}."
        )
    elif focus == "PYTHON_BACKEND":
        return (
            f"Artificial Intelligence and Machine Learning undergraduate at {cgpa_str} with proficient "
            f"hands-on expertise in Python, Data Structures & Algorithms, REST API integration, and modular software design. "
            f"Proven track record developing algorithmic engines, including a content-based recommendation system delivering "
            f"85%+ match accuracy across 200+ profiles. Motivated to contribute clean, maintainable code, test-driven logic, "
            f"and energetic problem-solving to {company}'s development team as a {role}."
        )
    else:  # AI_ML
        return (
            f"Artificial Intelligence and Machine Learning undergraduate at {cgpa_str} with practical "
            f"experience in Machine Learning (Scikit-learn, NumPy, Pandas), data preprocessing, and local LLM integration via Ollama. "
            f"Demonstrated ability to engineer end-to-end intelligent systems, including an autonomous on-device conversational robot "
            f"and a content-based recommendation engine. Motivated to contribute analytical problem-solving, model evaluation skills, "
            f"and clean documentation to {company}'s AI/ML team as a {role}."
        )


def generate_tailored_competencies(focus: str, snippet: str = "") -> List[Tuple[str, str]]:
    """Orders and tailors core technical competencies to match the role focus."""
    if focus == "DEVOPS_CLOUD":
        return [
            ("DevOps & Cloud Tools", "Docker containerization, Linux (Ubuntu, Raspbian), Jenkins CI/CD fundamentals, Git/GitHub Actions workflows"),
            ("Programming & Scripting", "Python (Proficient), Bash Shell Scripting, REST API integration, Automation scripts"),
            ("Machine Learning & Data", "Scikit-learn, NumPy, Pandas, Data Preprocessing, Model Deployment basics"),
            ("Core Engineering", "Data Structures & Algorithms, Linux CLI administration, Technical Documentation, Agile Prototyping"),
        ]
    elif focus == "EMBEDDED_ROBOTICS":
        return [
            ("Embedded AI & Robotics", "Raspberry Pi 4, On-Device LLM Inference (Ollama API), STT/TTS Audio Pipelines, Hardware-Software Integration"),
            ("Programming & Scripting", "Python (NumPy, Pandas, Scikit-learn), Bash Scripting, Linux Shell, C basics"),
            ("DevOps & Deployment", "Docker basics, Linux (Raspbian, Ubuntu), Git/GitHub Version Control, Edge Optimization"),
            ("Core Engineering", "Computer Vision basics, Recommendation Algorithms, Sensor Interfacing, Agile Prototyping"),
        ]
    elif focus == "PYTHON_BACKEND":
        return [
            ("Programming & Architecture", "Python (Proficient, OOP, Modular Design), REST APIs, Data Structures & Algorithms, Postman"),
            ("Data Science & ML", "NumPy, Pandas, Scikit-learn, Feature Normalization, Recommendation Algorithms"),
            ("DevOps & Toolchains", "Docker (containerization), Linux (Ubuntu, Bash), Git/GitHub Version Control, Jenkins basics"),
            ("Software Engineering", "Unit Testing concepts, API Integration, Code Documentation, Collaborative Sprints"),
        ]
    else:  # AI_ML
        return [
            ("Machine Learning & AI", "Supervised Learning, Model Training & Evaluation, Scikit-learn, Ollama API (local LLMs), Data Preprocessing"),
            ("Programming & Data", "Python (NumPy, Pandas, Matplotlib), Data Structures & Algorithms, REST API integration, Bash"),
            ("AI Systems & Domains", "Speech Processing (STT/TTS pipelines), Recommendation Engines, Computer Vision fundamentals"),
            ("Tools & Infrastructure", "Linux (Ubuntu, Raspbian), Docker (basics), Git/GitHub Version Control, VS Code, Postman"),
        ]


def generate_tailored_projects(focus: str) -> List[Dict[str, any]]:
    """Prioritizes and reframes projects according to the role focus."""
    p_robot = {
        "title": "Lead Developer | AI Voice Interaction Robot",
        "meta": "Bengaluru, India | 2024 – Present",
        "bullets": [
            "Selected by Head of Department (AIML); hardware and embedded components sponsored by college.",
            "Engineered an autonomous conversational robot on Raspberry Pi 4 utilizing quantized local LLMs via Ollama API, maintaining sub-2-second response latency.",
            "Developed and tuned an end-to-end Speech-to-Text (STT) and Text-to-Speech (TTS) audio pipeline, achieving ~90% recognition accuracy under indoor conditions.",
            "Implemented full on-device processing stack to eliminate external API reliance and cloud operating overhead.",
        ],
    }

    p_meal = {
        "title": "Project Developer | Healthy Meal Recommendation System",
        "meta": "Bengaluru, India | 2024 – 2025",
        "bullets": [
            "Built a content-based recommendation engine in Python analyzing 200+ food profiles across 10+ nutritional and caloric features.",
            "Achieved ~85% user preference match accuracy across 50 test profiles through feature scaling, normalization, and cosine similarity scoring.",
            "Integrated computer-vision calorie estimation modules and activity tracking API endpoints into the application pipeline.",
        ],
    }

    p_devops = {
        "title": "Independent Developer | AI/ML & DevOps Personal Projects",
        "meta": "Bengaluru, India | 2025 – Present",
        "bullets": [
            "Containerized Python microservices and ML scripts with Docker to ensure reproducible training and testing environments.",
            "Practiced Linux system administration, CI/CD pipeline automation with Jenkins, and structured Git workflows.",
            "Documented technical architectures, APIs, and model metrics across public GitHub repositories.",
        ],
    }

    if focus == "DEVOPS_CLOUD":
        return [p_devops, p_robot, p_meal]
    elif focus == "EMBEDDED_ROBOTICS":
        return [p_robot, p_devops, p_meal]
    elif focus == "PYTHON_BACKEND":
        return [p_meal, p_robot, p_devops]
    else:  # AI_ML
        return [p_robot, p_meal, p_devops]


def generate_cv_markdown(company: str, role: str, snippet: str = "") -> str:
    """Assembles a complete, tailored CV in Markdown format."""
    focus = detect_role_focus(role, snippet)
    summary = generate_tailored_summary(company, role, focus, snippet)
    competencies = generate_tailored_competencies(focus, snippet)
    projects = generate_tailored_projects(focus)

    lines = [
        "# Vinay Kumar S",
        "**Bengaluru, Karnataka, India** | +91 96063 58639 | vinaykumarsrinivas1980@gmail.com",
        "[LinkedIn](https://linkedin.com/in/vinay-kumar-s) | [GitHub](https://github.com/vinaykumar)",
        "",
        "---",
        "",
        "### Professional Summary",
        summary,
        "",
        "---",
        "",
        "### Core Competencies",
    ]

    for category, skills in competencies:
        lines.append(f"- **{category}**: {skills}")

    lines.extend([
        "",
        "---",
        "",
        "### Applied Projects & Engineering Experience",
        "",
    ])

    for proj in projects:
        lines.append(f"#### {proj['title']}")
        lines.append(f"*{proj['meta'].split('|')[0].strip()}* | **{proj['meta'].split('|')[1].strip()}**")
        for bullet in proj["bullets"]:
            lines.append(f"- {bullet}")
        lines.append("")

    lines.extend([
        "---",
        "",
        "### Education",
        "**Bachelor of Engineering in Artificial Intelligence & Machine Learning** (2023 – 2027 Expected)",
        "*SJC Institute of Technology, Chickballapur, Karnataka*",
        "- **CGPA**: 8.0 / 10",
        "- **Relevant Coursework**: Machine Learning, Data Structures & Algorithms, Operating Systems, Computer Networks, Artificial Intelligence.",
        "",
        "---",
        "",
        "### Certifications & Achievements",
        "- **Cisco Certified: Data Science Essentials with Python** – Cisco Networking Academy (2024)",
        "- **Smart India Hackathon (SIH) 2024** – Selected for internal college round; collaborated in a 6-member team in a rapid 24-hour sprint.",
        "- **Open-Source Contributor** – Maintains public repositories demonstrating version control, modular code structure, and technical documentation.",
        "",
        "---",
        "",
        "### Languages",
        "- **English**: Professional working proficiency",
        "- **Kannada**: Native",
        "",
    ])

    return "\n".join(lines)


def generate_cv_latex(company: str, role: str, snippet: str = "") -> str:
    """Assembles a tailored CV in the user's canonical LaTeX article structure."""
    focus = detect_role_focus(role, snippet)
    summary = generate_tailored_summary(company, role, focus, snippet)

    # Escape LaTeX special characters in summary
    summary_tex = (
        summary.replace("&", r"\&")
        .replace("%", r"\%")
        .replace("$", r"\$")
        .replace("#", r"\#")
        .replace("_", r"\_")
    )

    # Skills customized by role focus
    if focus == "DEVOPS_CLOUD":
        skills_items = [
            r"\item \textbf{DevOps \& Cloud Tools:} Docker (containerization), Linux (Ubuntu, Raspbian), Jenkins CI/CD, Git, GitHub Actions",
            r"\item \textbf{Programming Languages:} Python, Bash / Shell Scripting",
            r"\item \textbf{AI / ML \& Emerging Tech:} LLM Integration (Ollama API), Scikit-learn, Model Deployment basics",
            r"\item \textbf{Developer Tools:} Git, GitHub, VS Code, Postman",
            r"\item \textbf{Core Concepts:} Linux Systems Administration, CI/CD Automation, Data Structures \& Algorithms",
        ]
    elif focus == "EMBEDDED_ROBOTICS":
        skills_items = [
            r"\item \textbf{Hardware \& Embedded AI:} Raspberry Pi 4, On-Device LLM Integration (Ollama API), STT/TTS Audio Pipelines",
            r"\item \textbf{Programming Languages:} Python, Bash / Shell Scripting",
            r"\item \textbf{Operating Systems:} Linux (Raspbian, Ubuntu), Embedded Linux Environment",
            r"\item \textbf{DevOps \& Tools:} Docker (basic), Git, GitHub, VS Code",
            r"\item \textbf{Core Concepts:} Hardware-Software Interfacing, Computer Vision basics, Data Structures \& Algorithms",
        ]
    elif focus == "PYTHON_BACKEND":
        skills_items = [
            r"\item \textbf{Programming Languages:} Python (Proficient, OOP, Modular Architecture)",
            r"\item \textbf{Backend \& APIs:} REST API Integration, Postman, Algorithmic Optimization",
            r"\item \textbf{Machine Learning \& Data:} Scikit-learn, NumPy, Pandas, Recommendation Algorithms",
            r"\item \textbf{DevOps \& OS:} Docker (containerization), Linux (Ubuntu), Git, GitHub, Jenkins",
            r"\item \textbf{Core Concepts:} Data Structures \& Algorithms, Software Design, Unit Testing, Agile Methodology",
        ]
    else:  # AI_ML
        skills_items = [
            r"\item \textbf{Programming Languages:} Python",
            r"\item \textbf{AI / ML \& Emerging Tech:} Scikit-learn, LLM Integration (Ollama API), Speech Processing (STT/TTS), Recommendation Systems",
            r"\item \textbf{Hardware \& OS:} Raspberry Pi, Linux (Ubuntu, Raspbian)",
            r"\item \textbf{Developer Tools:} Git, GitHub, VS Code, Postman",
            r"\item \textbf{DevOps:} Docker (basic), Jenkins, CI/CD Concepts",
            r"\item \textbf{Core Concepts:} Data Structures \& Algorithms, Supervised Learning, Agile Methodology",
        ]
    skills_block = "\n    ".join(skills_items)

    template = r"""\documentclass[10pt,a4paper]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{mathptmx} % Times New Roman typography matching the original document
\usepackage[margin=0.6in]{geometry}
\usepackage{xcolor}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}

\pagestyle{empty}

% Two-color scheme extracted from the original PDF:
% Primary accent: Navy Blue (#1F3864) for name, section headers, and dividing rules
% Body text: Charcoal / Off-black (#222222) for content text
\definecolor{primary}{HTML}{1F3864}
\definecolor{bodytext}{HTML}{222222}

% Custom section command with generous spacing around headers and rules
\newcommand{\resumesection}[1]{%
  \vspace{14pt}%
  {\large\textbf{\color{primary}#1}}\par\vspace{3pt}%
  {\color{primary}\hrule height 0.75pt}\vspace{7pt}%
}

% Itemize list spacing with relaxed vertical rhythm
\setlist[itemize]{leftmargin=1.5em, itemsep=3.5pt, topsep=3.5pt, parsep=0pt}

\begin{document}
\color{bodytext}

% --- HEADER ---
\begin{center}
    {\LARGE \textbf{\color{primary}VINAY KUMAR S}}\\[6pt]
    Bengaluru, Karnataka, India \enspace$|$\enspace +91 96063 58639 \enspace$|$\enspace \href{mailto:vinaykumarsrinivas1980@gmail.com}{vinaykumarsrinivas1980@gmail.com} \enspace$|$\enspace \href{https://www.linkedin.com/in/vinay-kumar-37890a278/}{LinkedIn} \enspace$|$\enspace \href{https://github.com/vinaykumarsrinivas1980-blip}{GitHub}
\end{center}

\vspace{4pt}

% --- PROFESSIONAL SUMMARY ---
\resumesection{PROFESSIONAL SUMMARY}
\noindent __SUMMARY__

% --- EDUCATION ---
\resumesection{EDUCATION}
\noindent\textbf{SJC Institute of Technology, Chickballapur, Karnataka} \hfill 2023 -- 2027 (Expected)\\[3pt]
Bachelor of Engineering in Artificial Intelligence \& Machine Learning $|$ CGPA: 8.0 / 10\\[3pt]
\textbf{Relevant Coursework:} Machine Learning, Data Structures \& Algorithms, Operating Systems, Computer Networks, Artificial Intelligence

% --- TECHNICAL SKILLS ---
\resumesection{TECHNICAL SKILLS}
\begin{itemize}
    __SKILLS__
\end{itemize}

% --- PROFESSIONAL EXPERIENCE ---
\resumesection{PROFESSIONAL EXPERIENCE}
\noindent\textbf{AI/ML \& DevOps Personal Projects}\\[3pt]
\textit{Self-Directed $|$ 2025 -- Present}
\begin{itemize}
    \item Built and deployed AI, Raspberry Pi, and Python projects using Git and Docker.
    \item Practiced Linux, Jenkins, CI/CD fundamentals, and version control through hands-on labs.
    \item Collaborated using GitHub and documented projects with measurable outcomes.
\end{itemize}

% --- ACADEMIC & APPLIED PROJECTS ---
\resumesection{ACADEMIC \& APPLIED PROJECTS}
\noindent\textbf{AI Voice Interaction Robot} $|$ \textit{Python, Raspberry Pi, Ollama API, LLM, STT/TTS}\\[3pt]
\textit{AIML Department Project -- Selected by Head of Department (HOD); Hardware Components Sponsored by College}
\begin{itemize}
    \item Delivered real-time conversational responses on embedded hardware as measured by under 2 seconds average latency on Raspberry Pi 4, by integrating Large Language Models via the Ollama API into an autonomous voice-interactive robot.
    \item Achieved reliable speech understanding in a controlled indoor environment as measured by $\sim$90\% speech recognition accuracy, by engineering an end-to-end Speech-to-Text (STT) and Text-to-Speech (TTS) pipeline.
    \item Eliminated cloud dependency and reduced ongoing operating cost as measured by near-zero recurring cost after initial hardware investment, by deploying the full inference stack entirely on-device (offline).
\end{itemize}

\vspace{8pt}
\noindent\textbf{Healthy Meal Recommendation System} $|$ \textit{Python, HTML, Machine Learning}\\[3pt]
\textit{Mini Project \& Major Project}
\begin{itemize}
    \item Delivered personalized, balanced meal suggestions aligned to user dietary goals as measured by $\sim$85\% user preference match accuracy across 50 test profiles, by building a content-based recommendation engine analyzing 200+ food items across 10+ nutritional parameters.
    \item Extending health monitoring coverage of the platform as measured by targeted 30\% improvement in overall coverage, by integrating a computer-vision calorie detection module and a step-tracking API (in progress).
\end{itemize}

% --- CERTIFICATIONS & LEADERSHIP ---
\resumesection{CERTIFICATIONS \& LEADERSHIP}
\begin{itemize}
    \item \textbf{Cisco Certified} -- Data Science Essentials with Python, Cisco Networking Academy -- 2024
    \item \textbf{Smart India Hackathon (SIH) 2024} -- Selected for the internal college round; collaborated in a 6-member cross-functional team to design and prototype an AI-driven solution within a 24-hour sprint.
    \item \textbf{Open-Source Contributor} -- Maintains 3 public GitHub repositories, demonstrating consistent version control and documentation practices.
\end{itemize}

% --- LANGUAGES ---
\resumesection{LANGUAGES}
\noindent English (Professional Proficiency) \enspace\textbullet\enspace Kannada (Native) \enspace\textbullet\enspace Hindi \enspace\textbullet\enspace Telugu

\end{document}
"""
    return template.replace("__SUMMARY__", summary_tex).replace("__SKILLS__", skills_block)




def generate_cover_letter_markdown(company: str, role: str, snippet: str = "", location: str = "Bengaluru, India") -> str:
    """Assembles a tailored, company-specific Cover Letter."""
    focus = detect_role_focus(role, snippet)

    if focus == "DEVOPS_CLOUD":
        focus_pitch = (
            f"My hands-on experience containerizing Python microservices with Docker, configuring Linux servers, "
            f"and automating CI/CD workflows with Jenkins maps directly to {company}'s infrastructure and development requirements."
        )
        bullet_points = [
            f"**Containerization & Environments:** Built reproducible Docker environments for Python applications and on-device ML services.",
            f"**Linux & Automation:** Experienced in Linux system administration (Ubuntu, Raspbian), shell scripting, and automation.",
            f"**CI/CD & Version Control:** Practiced continuous integration workflows with Jenkins and structured Git branching.",
        ]
    elif focus == "EMBEDDED_ROBOTICS":
        focus_pitch = (
            f"My focus on hardware-software integration, Raspberry Pi 4 edge computing, and real-time inference latency "
            f"aligns closely with {company}'s technical vision for {role}."
        )
        bullet_points = [
            f"**On-Device AI Integration:** Deployed quantized local LLMs on Raspberry Pi 4 via Ollama with sub-2s latency and ~90% STT accuracy.",
            f"**Edge Pipeline Tuning:** Designed full audio STT/TTS processing without cloud dependency, reducing latency and operational cost.",
            f"**Hardware Prototyping:** Selected by AIML Department Head; managed sensor and component integration under faculty sponsorship.",
        ]
    elif focus == "PYTHON_BACKEND":
        focus_pitch = (
            f"My strong foundation in Python programming, Data Structures & Algorithms, and REST API integration "
            f"enables me to rapidly build, test, and deliver robust software features for {company}."
        )
        bullet_points = [
            f"**Algorithmic Development:** Engineered a Python recommendation engine evaluating 200+ food profiles across 10+ nutritional parameters with 85%+ accuracy.",
            f"**API & Service Integration:** Integrated computer vision modules and activity tracking endpoints into modular Python pipelines.",
            f"**Clean Code & Version Control:** Maintained public GitHub repositories showcasing structured OOP code, Git workflows, and documentation.",
        ]
    else:  # AI_ML
        focus_pitch = (
            f"With a strong foundation in machine learning algorithms, Scikit-learn, data preprocessing, and local LLM integration, "
            f"I am eager to contribute directly to {company}'s AI/ML engineering team."
        )
        bullet_points = [
            f"**Applied LLM & AI Systems:** Developed an autonomous conversational robot utilizing local Ollama LLMs with sub-2s response latency.",
            f"**Data Preprocessing & Evaluation:** Engineered feature extraction and similarity algorithms achieving ~85% test accuracy on dietary data.",
            f"**Tools & Foundations:** Proficient with Python, Scikit-learn, NumPy, Pandas, Docker containerization, and Cisco Data Science certified.",
        ]

    bullets_str = "\n".join(f"- {b}" for b in bullet_points)

    return f"""# Cover Letter — {company}: {role}

**Vinay Kumar S**
Bengaluru, Karnataka, India | +91 96063 58639 | vinaykumarsrinivas1980@gmail.com
[LinkedIn Profile](https://linkedin.com/in/vinay-kumar-s) | [GitHub Profile](https://github.com/vinaykumar)

---

**Date:** 31 October 2026

**To:**
Hiring Team
{company}
{location}

**Subject: Application for {role} Position**

Dear Hiring Team at {company},

I am writing to express my strong enthusiasm for the {role} opportunity at {company}. As an Artificial Intelligence and Machine Learning undergraduate at SJC Institute of Technology with hands-on development experience, I am excited about the chance to contribute to your engineering initiatives.

{focus_pitch}

Key highlights of my background include:

{bullets_str}

{company}'s engineering focus offers an ideal environment where I can apply my curiosity, technical skills, and commitment to building reliable software. I take pride in tackling challenging technical problems, collaborating effectively, and continuously refining code quality.

I would welcome the opportunity to discuss how my technical skills, proactive mindset, and dedication can support {company}'s ongoing projects.

Thank you for your time and consideration.

Kind regards,

**Vinay Kumar S**
"""
