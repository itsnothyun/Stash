# GitHub Remote Setup Guide for Stash ✦

Follow these quick step-by-step instructions to create your GitHub repository, connect this local codebase, and push your commits.

---

## ✦ Step 1: Create a New Repository on GitHub

1. Open your browser and navigate to [https://github.com/new](https://github.com/new).
2. Set the **Repository name** (for example: `stash` or `stash-desktop`).
3. (Optional) Add a short description (e.g., *“High-performance, local-first floating workspace utility for desktop”*).
4. Choose **Public** or **Private** based on your preference.
5. **CRITICAL**: Under **"Initialize this repository with:"**, leave all options **UNCHECKED**:
   - ❌ Do **NOT** add a README file (we already have a complete one).
   - ❌ Do **NOT** add `.gitignore` (we already have a tailored one).
   - ❌ Do **NOT** choose a license yet (we already have it).
6. Click the green **Create repository** button.

---

## ✦ Step 2: Copy Your Repository URL

After creating the repository, GitHub will show you the repository URL:

- **HTTPS format**: `https://github.com/<your-username>/<repo-name>.git`
- **SSH format**: `git@github.com:<your-username>/<repo-name>.git`

Copy this URL to your clipboard.

---

## ✦ Step 3: Connect and Push from Your Terminal

Open PowerShell or your preferred terminal in this project root (`E:\Workspace\Stash\Stash`) and run the following commands:

### 1. Stage All Project Files
```powershell
git add .
```

### 2. Create the Initial Commit
```powershell
git commit -m "feat: complete Stash desktop suite with personalization, widgets, and ghost mode"
```

### 3. Ensure the Default Branch is `main`
```powershell
git branch -M main
```

### 4. Link Your GitHub Repository as Remote
Replace `<YOUR_GITHUB_REPO_URL>` with the URL you copied from Step 2:
```powershell
git remote add origin <YOUR_GITHUB_REPO_URL>
```
*(Example: `git remote add origin https://github.com/yourname/stash.git`)*

> [!TIP]
> If you already added a remote and want to change or verify it:
> ```powershell
> git remote -v
> # If needed to replace:
> git remote set-url origin <YOUR_GITHUB_REPO_URL>
> ```

### 5. Push to GitHub
```powershell
git push -u origin main
```

---

## ✦ Troubleshooting & Tips

### If GitHub asks for authentication:
- **HTTPS**: GitHub no longer accepts account passwords for Git operations. Use a **GitHub Personal Access Token (Classic or Fine-grained)** with `repo` scope as your password, or use the **GitHub CLI** (`gh auth login`).
- **SSH**: Ensure your SSH public key (`id_ed25519.pub` or `id_rsa.pub`) is added to [GitHub SSH Settings](https://github.com/settings/keys).

### If you accidentally checked "Add a README" on GitHub:
If GitHub created an initial commit with a README or license, Git may reject the push with `[rejected - non-fast-forward]`. To resolve:
```powershell
# Pull and rebase existing remote commits:
git pull origin main --rebase

# Then push:
git push -u origin main
```
Or force push if you want this local repo to be the source of truth:
```powershell
git push -u origin main --force
```

---

## ✦ Future Updates Workflow

Whenever you make changes in the future, push them with:
```powershell
git add .
git commit -m "your description of changes"
git push
```
