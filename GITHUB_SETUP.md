# GitHub Remote Setup Guide for Stash

Follow these quick step-by-step instructions to connect your local codebase and push future updates.

---

## Step 1: Create a New Repository on GitHub

1. Open your browser and navigate to [https://github.com/new](https://github.com/new).
2. Set the **Repository name** (e.g. `Stash`).
3. Choose **Public** or **Private** based on your preference.
4. Leave all initialization options unchecked.
5. Click **Create repository**.

---

## Step 2: Copy Your Repository URL

- **HTTPS format**: `https://github.com/itsnothyun/Stash.git`
- **SSH format**: `git@github.com:itsnothyun/Stash.git`

---

## Step 3: Connect and Push from Your Terminal

```powershell
# 1. Stage all project files
git add .

# 2. Commit your changes
git commit -m "feat: your description of changes"

# 3. Push to GitHub
git push origin main
```

---

## Troubleshooting & Tips

### If GitHub asks for authentication:
- **HTTPS**: Use a GitHub Personal Access Token (PAT) with `repo` scope or use `gh auth login`.
- **SSH**: Ensure your SSH public key is added to GitHub Settings.

---

## Future Updates Workflow

Whenever you make changes in the future, push them with:
```powershell
git add .
git commit -m "your description of changes"
git push
```
