# Job Application Assistant for Vinay Kumar S

## Role
This repo is a job application workspace. Claude / Antigravity acts as a career advisor and application assistant for Vinay Kumar S, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

### Identity
- **Name:** Vinay Kumar S
- **Location:** Bengaluru, Karnataka, India (Flexible: Bengaluru Onsite/Hybrid, India Metro, or Global Remote)
- **Languages:**
  | Language | Level |
  |----------|-------|
  | English | Professional working proficiency |
  | Kannada | Native |
- **CV language:** English

- **Status:** Undergraduate Student / Actively Seeking Internship & Entry-Level Roles (Graduating 2027)
- **LinkedIn headline:** "AI/ML Undergraduate | Python Developer | Robotics & Embedded AI | DevOps Enthusiast"
- **Contact:**
  - Phone: +91 96063 58639
  - Email: vinaykumarsrinivas1980@gmail.com
  - GitHub: github.com/vinaykumar

### Education
- **Bachelor of Engineering in Artificial Intelligence & Machine Learning** (2023 - 2027 Expected) - SJC Institute of Technology, Chickballapur, Karnataka
  - CGPA: 8.0 / 10
  - Topics: Machine Learning, Data Structures & Algorithms, Operating Systems, Computer Networks, Artificial Intelligence

### Professional Experience & Applied Projects
- **AI/ML & DevOps Personal Projects** (2025 - Present) - **Self-Directed** (Bengaluru, India)
  - Built and deployed AI, Raspberry Pi, and Python projects using Git and Docker.
  - Practiced Linux (Ubuntu, Raspbian), Jenkins, CI/CD fundamentals, and version control through hands-on labs.
  - Maintained public GitHub repositories and documented technical milestones with measurable outcomes.
- **AI Voice Interaction Robot** - Lead Developer (AIML Dept Project, SJC Institute of Technology)
  - Selected by Head of Department (HOD); Hardware components sponsored by college.
  - Delivered real-time conversational responses on embedded hardware under 2 seconds average latency on Raspberry Pi 4 via Ollama API LLM integration.
  - Engineered end-to-end Speech-to-Text (STT) and Text-to-Speech (TTS) pipeline achieving ~90% speech recognition accuracy in indoor environments.
  - Deployed full inference stack on-device, eliminating cloud dependency and recurring API costs.
- **Healthy Meal Recommendation System** - Mini & Major Project
  - Built content-based recommendation engine analyzing 200+ food items across 10+ nutritional parameters, achieving ~85% user preference match accuracy across 50 test profiles.
  - Integrated computer-vision calorie detection module and health tracking APIs.

### Technical Skills
- **Primary:** Python, Machine Learning (Scikit-learn), Data Structures & Algorithms
- **Secondary:** Linux (Ubuntu, Raspbian), Docker (basics), Jenkins & CI/CD concepts, Git/GitHub
- **Domain:** LLM Integration (Ollama API), On-Device AI / Embedded Systems (Raspberry Pi), Speech Processing (STT/TTS), Recommendation Systems, Computer Vision
- **Software:** VS Code, Git, Docker, Linux Shell / Bash, Postman

### Certifications
- **Cisco Certified: Data Science Essentials with Python** - Cisco Networking Academy (2024)

### Awards & Leadership
- **Smart India Hackathon (SIH) 2024** - Selected for internal college round; collaborated in a 6-member cross-functional team in a 24-hour sprint.
- **Open-Source Contributor** - Maintains public GitHub repositories demonstrating version control and technical documentation.

### Behavioral Profile
- **Analytical & Systems-Oriented:** Enjoys end-to-end implementation from embedded sensors to high-level LLM reasoning.
- **Self-Directed Learner:** Rapidly acquires and applies new frameworks (Docker, Jenkins, Ollama, Linux admin).
- **Strengths:** Problem-solving, hardware-software integration, persistence through debugging, clean technical documentation.
- **Growth areas:** Deepening cloud native microservices architecture, expanding production-scale Kubernetes.
- **Thrives in:** Collaborative, engineering-first environments that value hands-on prototyping, curiosity, and rapid iteration.

### What Excites You
- Building autonomous AI agents, LLM applications, and robotics systems.
- Automating workflows, CI/CD pipelines, and infrastructure deployment.
- High-impact software development that solves tangible everyday problems.

### Target Sectors
- **AI/ML & Generative AI Startups / Tech Companies:** Roles in AI/ML Engineering, Applied AI, and LLM Application Development.
- **Software Engineering & Cloud Infrastructure:** Python Developer, Backend Software Engineer, DevOps / SRE Internships.

### Deal-breakers
- Purely non-technical/data entry roles with no programming or engineering scope.
- Toxic or unstructured environments with zero engineering mentorship.

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv template, banking style)
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools
- `documents/` - Source documentation repository (CVs, credentials, projects)

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>_<role>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify all checklist items before presenting to the user.
