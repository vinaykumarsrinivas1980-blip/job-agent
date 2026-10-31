# How to Run AI Job Hub on Mobile (Zero PC Needed)

This guide shows you how to deploy your AI Job Hub to the cloud for free so you can search jobs and download tailored PDFs directly from your phone **without needing your PC on or any CMD running**.

---

### Step 1: Push Your Project to GitHub

If you haven't already pushed your latest code to your GitHub repository:
```powershell
git add .
git commit -m "Add mobile cloud app & dynamic PDF tailoring"
git push origin main
```

---

### Step 2: Set Up Free Cloud Hosting on Render.com

1. Go to **[https://render.com](https://render.com)** and click **Sign Up** (choose **"Sign in with GitHub"**).
2. On your dashboard, click the blue **"New +"** button at the top right, then select **"Web Service"**.
3. Select **"Build and deploy from a Git repository"** and choose your `ai-job-search` repository.
4. Render will ask for basic settings:
   - **Name**: `vinay-job-hub` (or any name you like)
   - **Region**: Singapore or Frankfurt (closest to India)
   - **Runtime**: `Python`
   - **Build Command**: 
     ```bash
     pip install -r mobile_app/requirements.txt
     ```
   - **Start Command**: 
     ```bash
     python mobile_app/server.py
     ```
   - **Instance Type**: Select **Free** ($0/month)
5. Click **"Deploy Web Service"**.

*Render will build your app and in ~2 minutes give you a free live URL (e.g., `https://vinay-job-hub.onrender.com`).*

---

### Step 3: Install on Your Mobile Phone (iPhone / Android)

Once your Render URL is live, open that link on your phone:

#### On iPhone (Safari):
1. Open your Render URL in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top right corner.

#### On Android (Chrome):
1. Open your Render URL in **Chrome**.
2. Tap the **three dots (⋮)** in the top right corner.
3. Tap **"Install App"** or **"Add to Home screen"**.

---

### Step 4: How to Apply Directly From Your Phone

1. Tap the **AI Job Hub** icon on your phone's home screen (it opens full-screen like a native app).
2. Search for any role (e.g. `AI ML Intern`, `Python Developer`, `DevOps`).
3. Tap **"1. Apply on Portal ↗"** to open the job portal on your phone.
4. Tap **"2. 📄 Download Tailored Resume"**:
   - The cloud server automatically generates `Resume_VinayKumar_<Company>.pdf` custom-tailored to that employer.
   - It downloads straight to your phone's Files / Downloads folder ready to upload to the portal!
5. **Your PC can remain completely turned off.**
