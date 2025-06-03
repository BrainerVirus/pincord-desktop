# Contributing to Electron React Template

First off, thank you for considering contributing to the Electron React Template! We aim to provide a modern, feature-rich, and easy-to-use foundation for building cross-platform desktop applications. Your contributions are valuable in helping us achieve this goal.

This document provides guidelines for contributing to this project. Please read it carefully to ensure a smooth and effective collaboration process.

## 📜 Code of Conduct

This project and everyone participating in it is governed by the [Electron React Template Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to @BrainerVirus.

## 🤔 How Can I Contribute?

There are many ways to contribute, from reporting bugs and suggesting features to improving documentation and submitting code changes.

### 🐛 Reporting Bugs

If you find a bug in the template itself (not in an application you built _using_ the template, unless the bug originates from the template's core), please help us by submitting an issue.

- **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/BrainerVirus/electron-react-template/issues).
- If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/BrainerVirus/electron-react-template/issues/new?template=bug_report.yml). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### ✨ Suggesting Enhancements or New Features

We're always looking for ways to improve the template! If you have an idea for an enhancement or a new feature:

- **Check if the enhancement was already suggested** by searching on GitHub under [Issues](https://github.com/BrainerVirus/electron-react-template/issues).
- If it hasn't been suggested, [open a new feature request issue](https://github.com/BrainerVirus/electron-react-template/issues/new?template=feature_request.yml).
- Clearly describe the proposed enhancement, why it would be beneficial, and any potential implementation ideas.
- For significant changes, it's often best to discuss the idea in an issue first before starting implementation.

### 💻 Your First Code Contribution (Pull Requests)

Ready to contribute code? Here’s how to set up your environment and submit a Pull Request (PR):

**1. Setting Up Your Environment:**

- **Fork the repository:** Click the "Fork" button at the top right of the [Electron React Template repository](https://github.com/BrainerVirus/electron-react-template).
- **Clone your fork:**
  ```bash
  git clone https://github.com/YOUR-USERNAME/electron-react-template.git
  cd electron-react-template
  ```
- **Install dependencies:**

  ```bash
  npm install
  ```

**2. Branching (GitHub Flow):**

- Create a new branch from the `main` branch in your fork for your changes. Choose a descriptive branch name (e.g., `feature/add-new-utility`, `fix/readme-typo`).

  ```bash
  git checkout -b feature/your-descriptive-branch-name
  ```

**3. Making Changes:**

- Write your code, ensuring it adheres to the existing code style.
- **Write clear and concise commit messages.** We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is important as it helps with automated versioning and changelog generation for the template itself.
  - Examples: `feat: add dark mode toggle utility`, `fix: correct typo in README setup instructions`, `docs: update contributing guidelines`.
- **Add or update tests** for any new functionality or bug fixes.
- **Update documentation** (README.md, comments in code, etc.) if your changes require it.
- Ensure your changes do not introduce new linting errors or test failures.

**4. Running Checks Locally:**

Before pushing your changes, please run the following commands to ensure everything is in order:

```bash
npm run lint       # Check for linting errors
npm run format:fix # Automatically format your code
npm test         # Run unit/integration tests
npm run coverage   # Check code coverage (and ensure it doesn't decrease significantly)
```

**5. Submitting Your Pull Request:**

- Push your feature branch to your fork on GitHub:

  ```bash
  git push origin feature/your-descriptive-branch-name
  ```

- Go to the [Electron React Template repository](https://github.com/BrainerVirus/electron-react-template) on GitHub. You should see a prompt to create a Pull Request from your recently pushed branch.
- Click "Compare & pull request."
- Ensure the base repository is `BrainerVirus/electron-react-template` and the base branch is `main`.
- Ensure the head repository is your fork and the compare branch is your feature branch.
- Fill out the Pull Request template with a clear title and description of your changes. Link to any relevant issues (e.g., "Closes #123").
- Click "Create pull request."

**6. Code Review:**

- Once your PR is submitted, a maintainer (likely @BrainerVirus) will review your changes.
- Be prepared for feedback and discussion. We aim for constructive reviews to ensure high-quality contributions.
- Make any necessary changes based on the review by pushing new commits to your feature branch. The PR will update automatically.

## 🎨 Style Guides

### Code Style

We use ESLint for linting and Prettier for code formatting. Configuration files (`eslint.config.js`, `prettier.config.js`) are included in the repository. Please ensure your contributions adhere to these styles. Running `npm run check` or `npm run format:fix` and `npm run lint:fix` can help.

### Commit Messages

As mentioned, we follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is crucial for our release process. Common prefixes include:

- `feat:` (new feature for the template)
- `fix:` (bug fix in the template)
- `docs:` (changes to documentation)
- `style:` (formatting, missing semi colons, etc.; no code logic change)
- `refactor:` (refactoring production code, e.g. renaming a variable)
- `test:` (adding missing tests, refactoring tests; no production code change)
- `chore:` (updating grunt tasks etc; no production code change)

If your change includes a **BREAKING CHANGE**, make sure to note it in the commit body or footer as per the specification.

## ❓ Questions?

If you have questions about contributing, how the template works, or anything else, please:

- Check the [README.md](README.md) for general information.
- **For general questions or discussions, please use our [GitHub Discussions (Q&A Category)](https://github.com/BrainerVirus/electron-react-template/discussions/new?category=q-a).**
- If you believe you've found a bug, please [open a Bug Report](https://github.com/BrainerVirus/electron-react-template/issues/new?template=bug_report.yml).
- If you have a feature idea, please [open a Feature Request](https://github.com/BrainerVirus/electron-react-template/issues/new?template=feature_request.yml).

Thank you for helping make Electron React Template better!
