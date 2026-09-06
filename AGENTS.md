
# Agent Skill Creation Guide for WebBasedPOS

This guide outlines the process for creating, testing, and deploying new agent skills within the WebBasedPOS project. Adherence to these guidelines is mandatory to ensure system stability, security, and a consistent user experience.

## 1. Core Principles

All agent skills must align with the core architectural and business logic principles of the WebBasedPOS system. Before writing any code, ensure your proposed skill does not violate the following non-negotiable rules as defined in `SKILLS.md`:

- **Financial Precision**: All calculations involving currency must use `Decimal.js` or a similar library to avoid floating-point inaccuracies.
- **Cart State Immutability**: The cart state must be treated as immutable. State transitions must be handled through the designated state management solution (e.g., Redux Toolkit, Zustand) and its defined reducers/actions.
- **API Security**: All interactions with the Supabase backend must be authenticated and authorized using Row Level Security (RLS). Direct database manipulation from the client-side is strictly forbidden.

## 2. Development Workflow

### Step 1: Define the Skill
Create a new `.md` file in the `skills/` directory. The filename should be descriptive and follow the `kebab-case` convention (e.g., `apply-discount-to-item.md`).

The skill definition file must include:
- **Name**: A clear, concise name for the skill.
- **Description**: A brief explanation of what the skill does.
- **Triggers**: A list of phrases or keywords that should activate the skill.
- **Implementation Plan**: A step-by-step plan detailing the code changes, API endpoints, and database modifications required.

### Step 2: Implement the Logic
- **Frontend**: For skills requiring UI components, use Next.js, React, and Tailwind CSS. Components should be responsive and accessible.
- **Backend**: For skills requiring backend logic, create a new Supabase Edge Function. The function must be written in TypeScript and include robust error handling.
- **State Management**: If the skill modifies the application state, dispatch the appropriate actions to update the store.

### Step 3: Write Tests
- **Unit Tests**: Write unit tests for all new functions and components using Jest and React Testing Library.
- **Integration Tests**: Write integration tests to verify that the skill interacts correctly with other parts of the system.
- **End-to-End Tests**: Use Cypress to create end-to-end tests that simulate real user scenarios.

### Step 4: Submit for Review
Create a pull request on GitHub. The PR description must include a link to the skill definition file and a summary of the changes. All tests must pass before the PR can be merged.

## 3. Security and Responsiveness

- **Security**: All agent skills must be designed with security as a top priority. This includes validating all user inputs, sanitizing data to prevent XSS attacks, and ensuring that all API requests are properly authenticated and authorized.
- **Responsiveness**: All UI components must be fully responsive and tested on a range of devices, from mobile phones to large desktop monitors. Use Tailwind CSS's responsive design features to create a seamless experience across all screen sizes.

By following this guide, we can ensure that all new agent skills are well-designed, thoroughly tested, and a valuable addition to the WebBasedPOS platform.
