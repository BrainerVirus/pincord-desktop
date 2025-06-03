# Electron React Template

A modern, feature-rich template for building cross-platform desktop applications with Electron, React, TypeScript, and Tailwind CSS.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📋 Overview

This template provides a solid foundation for developing Electron applications with a modern React frontend. It comes pre-configured with TypeScript, Tailwind CSS, TanStack Router, and Shadcn UI components to help you build beautiful, type-safe desktop applications quickly.

## ✨ Features

- **Electron** - Cross-platform desktop application framework
- **React 19** - Latest React with modern features
- **TypeScript** - Type safety throughout the codebase
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Router** - File-based routing with type safety
- **Shadcn UI** - High-quality, customizable UI components
- **ESLint & Prettier** - Code linting and formatting
- **Vite** - Fast development and build tooling
- **Vitest** - Unit testing framework
- **Million.js** - Performance optimization for React
- **Cross-platform** - Build for Windows, macOS, and Linux

## 🔄 Using This Template

This repository is designed to be used as a template for building Electron applications with React. There are two ways to use it:

### Option 1: GitHub Template (Recommended)

1. Click the "Use this template" button at the top of the repository
2. Select "Create a new repository"
3. Choose the owner and name for your new repository
4. Click "Create repository from template"
5. Clone your new repository:

   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   cd YOUR-REPO-NAME
   ```

6. Install dependencies:
   ```bash
   npm install
   ```

**Benefits:** Creates a fresh repository without commit history, ready for your project.

### Option 2: Clone and Customize

```bash
# Clone the repository
git clone https://github.com/BrainerVirus/electron-react-template.git my-app

# Enter project directory
cd my-app

# Reset Git history
rm -rf .git
git init
git add .
git commit -m "Initial commit from template"

# Install dependencies
npm install
```

### Required Post-Template Setup

After creating your project using either method above, you'll need to:

1.  **Update package.json**:

    - Change the `name`, `description`, and `version` (e.g., to `0.1.0` or `1.0.0`).
    - Update the `author` object with your details.
    - Update the `repository.url` to point to your new repository.
    - Adjust any dependencies in `dependencies` and `devDependencies` as needed for your project.

2.  **Configure GitHub Actions**:
    - Keep or modify release.yml based on your needs:
      - For a template/library: Use the simpler template release workflow
      - For an application: Use the full Electron build workflow (see below)

## 📜 Available Scripts

This project uses npm for script management. Here are some of the most common scripts:

- `npm run dev`: Starts the development server for both React and Electron. It uses `start-server-and-test` to first launch the React dev server and then the Electron app.
- `npm run dev:react`: Starts only the Vite development server for the React frontend.
- `npm run dev:electron`: Transpiles Electron's TypeScript code and then starts Electron in development mode, assuming the React dev server is already running.
- `npm run build`: Builds the React application using Vite and transpiles Electron's TypeScript code.
- `npm run serve`: Serves the built React application locally using Vite's preview server.
- `npm test`: Runs tests using Vitest in watch mode.
- `npm run coverage`: Runs tests and generates a code coverage report.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and attempts to automatically fix issues.
- `npm run format`: Checks code formatting using Prettier.
- `npm run format:fix`: Formats the codebase using Prettier.
- `npm run check`: Runs both Prettier formatting (and fixes) and ESLint linting (and fixes).
- `npm run prepare`: Sets up Husky git hooks.
- `npm run lint-staged`: Runs linters on staged files (used by Husky pre-commit hook).
- `npm run commit`: Starts Commitizen CLI for conventional commits.
- `npm run transpile:electron`: Transpiles only the Electron main process TypeScript code.
- `npm run dist:mac`: Builds the application for macOS (ARM64).
- `npm run dist:linux`: Builds the application for Linux (x64).
- `npm run dist:win`: Builds the application for Windows (x64).
- `npm run dist:all`: Builds the application for macOS, Linux, and Windows.

Refer to the `scripts` section in the [`package.json`](package.json) file for a complete list.

## 🚀 Development Workflow

### Prerequisites

- Node.js `>=22.14.0`
- npm `>=10.9.2`

### Development

```bash
# Start the development server (React + Electron)
npm run dev
```

### Building for Production

```bash
# Build for your current platform
npm run build

# Build for specific platforms
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
npm run dist:all    # All platforms
```

## 👨‍💻 Development Guide

### Adding Routes

Create new files in the routes directory:

```tsx
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <div>
      <h1>About Page</h1>
    </div>
  );
}
```

### Adding Links for Navigation

```tsx
import { Link } from '@tanstack/react-router';

// In your component
<Link to="/about">About</Link>;
```

## 🛠️ CI/CD Configuration

This project comes with pre-configured GitHub Actions workflows for Continuous Integration (CI), automated Releases, and GitHub Pages deployment of test and coverage reports.

### 1. Continuous Integration Workflow (`ci.yml`)

This workflow runs on every push to any branch and on every pull request targeting the `main` branch. It performs the following jobs:

- **Lint**:
  - Checks out the code.
  - Sets up Node.js (version 22).
  - Installs dependencies using `npm ci`.
  - Runs ESLint (`npm run lint`).
  - Checks code formatting with Prettier (`npx prettier --check .`).
- **Test and Coverage**:
  - Checks out the code.
  - Sets up Node.js (version 22).
  - Installs dependencies using `npm ci`.
  - Runs unit/integration tests (`npm test`).
  - Generates code coverage report (`npm run coverage`).
  - Uploads Vitest HTML Test Report (from `report/index.html` as per `vite.config.js`) as an artifact.
    _Note: The workflow uploads from `report/`. Ensure this path matches your Vitest HTML reporter output in [`vite.config.js`](vite.config.js) or update the workflow._
  - Uploads Vitest HTML Coverage Report (from `coverage/`) as an artifact.

Refer to the file [`ci.yml`](./.github/workflows/ci.yml) to see with details.

### 2. Release Workflow (`release.yml`)

This workflow runs on every push to the `main` branch. It handles linting, testing, building the application for multiple platforms, creating a GitHub release using `semantic-release`, and deploying test/coverage reports to GitHub Pages.

**Jobs:**

- **Lint**: Same as the lint job in the CI workflow.
- **Test and Coverage**: Same as the test and coverage job in the CI workflow.
- **Deploy Reports to GitHub Pages**:
  - Runs after the `test_and_coverage` job completes successfully.
  - Downloads the test and coverage reports artifacts from the `test_and_coverage` job.
  - Prepares the reports for deployment to GitHub Pages.
  - Uploads the reports to GitHub Pages.
- **Build**:
  - Runs after `lint` and `test_and_coverage` jobs complete successfully.
  - Uses a matrix strategy to build the application for Windows, macOS, and Linux.
    - **Windows**: Runs `npm run dist:win`.
    - **macOS**: Runs `npm run dist:mac`.
    - **Linux**: Runs `npm run dist:linux`.
  - Uploads the build artifacts from the `dist/` directory for each platform (e.g., `app-artifacts-windows`, `app-artifacts-mac`, `app-artifacts-linux`).
- **Release**:
  - Runs after the `build` job completes successfully.
  - Sets up Node.js and installs dependencies.
  - Downloads the build artifacts created by the `build` job into respective directories (`windows-build/`, `mac-build/`, `linux-build/`).
  - Runs `npx semantic-release` to:
    - Analyze commits to determine the next version.
    - Generate release notes and update [`CHANGELOG.md`](CHANGELOG.md).
    - Tag the release in Git.
    - Create a GitHub Release.
    - Upload the platform-specific build artifacts (e.g., `.exe`, `.dmg`, `.AppImage`) to the GitHub Release, as configured in [`.releaserc.json`](.releaserc.json).

Refer to the file [`release.yml`](./.github/workflows/release.yml) to see with details.

### Required Post-Template Setup for Releases:

If you are using this repository as a template for a new project, remember to:

1.  **Update `package.json`**: Ensure `name`, `description`, `author`, and `repository.url` are correct for your project.
2.  **GitHub Secrets**: `semantic-release` requires a `GITHUB_TOKEN` with appropriate permissions to create releases and push to the repository. The default `secrets.GITHUB_TOKEN` provided by GitHub Actions usually has sufficient permissions for public repositories. For private repositories, you might need to adjust permissions or use a Personal Access Token (PAT).
3.  **Release Configuration (`.releaserc.json`)**: Review the asset paths in [`.releaserc.json`](.releaserc.json) to ensure they match the output of your build process if you make changes to the build scripts or `electron-builder.json`.

### Triggering Releases:

Releases are triggered automatically by `semantic-release` based on commit messages on the `main` branch. Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat: add new feature` (triggers a minor release, e.g., 1.0.0 -> 1.1.0)
- `fix: resolve bug` (triggers a patch release, e.g., 1.0.0 -> 1.0.1)
- Commits with `BREAKING CHANGE:` in the body or footer trigger a major release (e.g., 1.0.0 -> 2.0.0).
- Other commit types like `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:` typically do not trigger a release unless they include a breaking change.

Pushing these commits to `main` will initiate the release workflow.

## 🌐 Electron Configuration

This template includes a basic Electron configuration in main.ts:

- Development mode loads from `http://localhost:5123`
- Production mode loads from index.html

To customize Electron functionality, modify the [main.ts](./src/electron/main.ts) file.

## 🔧 Configuration Files

- **[tsconfig.json (main)](./tsconfig.json)** - Main TypeScript configuration
- **[tsconfig.json (electron)](./src/electron/tsconfig.json)** - Electron process TypeScript configuration
- **[vite.config.js](./vite.config.js)** - Vite bundler configuration
- **[electron-builder.json](./electron-builder.json)** - Electron builder configuration
- **[eslint.config.js](./eslint.config.js)** - ESLint rules configuration
- **[prettier.config.js](./prettier.config.js)** - Prettier formatting rules

## 📚 Useful Resources

- [Electron Documentation](https://www.electronjs.org/docs/latest)
- [React Documentation](https://react.dev/)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)

## 📄 License

This project is licensed under the MIT License - see the license.md file for details.

## ✨ Acknowledgments

- [TanStack](https://tanstack.com/)
- [Shadcn](https://ui.shadcn.com/)
- [Electron](https://www.electronjs.org/)
- [Vite](https://vitejs.dev/)

---

Made with ❤️ by [Cristhofer Pincetti](https://github.com/BrainerVirus)
