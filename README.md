# Halleyx Workflow Engine - Frontend

A role-based React application that serves as the user interface for the Halleyx Workflow Engine. The frontend provides four distinct dashboards tailored to each user role, enabling workflow design, execution, approval management, and full audit visibility.

---

## Project Demo

[![Halleyx Workflow Engine Demo](https://img.youtube.com/vi/ucqeoIy4o6c/maxresdefault.jpg)](https://youtu.be/ucqeoIy4o6c)

Click the thumbnail above to watch the full project walkthrough on YouTube.

---
open the react on the port = "http://localhost:5174"
## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Role-Based Dashboards](#role-based-dashboards)
- [Application Flow](#application-flow)
- [Project Structure](#project-structure)
- [Pages and Features](#pages-and-features)
- [API Layer](#api-layer)
- [Installation Guide](#installation-guide)
- [Environment Configuration](#environment-configuration)
- [Routing Reference](#routing-reference)

---

## Overview

The frontend application connects to the Spring Boot backend via REST APIs using Axios with session-based authentication. On login, users are automatically redirected to their role-specific dashboard. Each dashboard is protected by route guards that enforce role access.

Key capabilities by role:

- Admin can build workflows visually using a form-based input schema builder, add steps, define conditional rules, manage users, and view the complete audit log.
- Employees can execute workflows by filling in a dynamic form generated from the workflow input schema, and track step-by-step progress in real time.
- Managers receive pending approval requests in their dashboard, can approve or reject with a comment, and view their personal approval history.
- CEOs have all Manager capabilities plus full visibility into every execution and all workflow steps across all users.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| State Management | React Context API (AuthContext) |
| Styling | Inline styles + Global CSS (index.css) |
| Language | JavaScript (JSX) |

---

## Role-Based Dashboards

| Role | Route | Dashboard |
|---|---|---|
| ADMIN | / | Workflow management, audit log, user management |
| EMPLOYEE | /executions | Execute workflows, track step progress |
| MANAGER | /manager | Pending approvals, approval history |
| CEO | /ceo | Pending approvals, all executions with full step detail |

---

## Application Flow

```
User visits application
        |
        +-- Not authenticated --> /login
        |
        +-- Authenticated --> role-based redirect
              |
              ADMIN    --> /               (AdminDashboard)
              MANAGER  --> /manager        (ManagerDashboard)
              CEO      --> /ceo            (CeoDashboard)
              EMPLOYEE --> /executions     (EmployeeDashboard)

ADMIN creates workflow:
  AdminDashboard
    --> Create Workflow (WorkflowEditor)
          --> Add fields using visual schema builder
          --> Add steps (APPROVAL / NOTIFICATION / TASK)
          --> Set assignee email per APPROVAL step
          --> Set start step
          --> Add rules per step (RuleEditor)
                --> Priority + MVEL condition + next step dropdown

EMPLOYEE executes workflow:
  EmployeeDashboard (Workflows tab)
    --> Click Execute
    --> Dynamic form renders from workflow input schema
    --> Submit --> Execution starts
    --> Track modal shows real-time step progress
          --> Completed steps shown in green
          --> Current step shown in amber
          --> Auto-completed steps (NOTIFICATION/TASK) marked automatically

MANAGER / CEO approves:
  ManagerDashboard or CeoDashboard (Pending Approvals tab)
    --> Card shows submitter name, input data, previous steps
    --> Click Approve --> execution moves to next step
    --> Click Reject --> modal asks for reason --> execution FAILED

ADMIN views audit:
  AuditLog
    --> Full table of all executions
    --> Expand any row to see step-by-step logs with approver names and timestamps
```

---

## Project Structure

```
src/
|
+-- api/
|     authApi.js            - login, logout, getMe
|     workflowApi.js        - CRUD for workflows
|     stepApi.js            - CRUD for steps
|     ruleApi.js            - CRUD for rules
|     ExecutionApi.jsx      - startExecution, approve, reject, cancel, retry, pending
|     userApi.js            - getAllUsers, createUser, updateRole, deleteUser
|
+-- context/
|     AuthContext.jsx       - user state, login(), logout(), loading flag
|
+-- components/
|     Navbar.jsx            - role-aware navigation bar with user name and role badge
|     ProtectedRoute.jsx    - ProtectedRoute (any auth) and RoleRoute (specific roles)
|     StatusBadge.jsx       - colored badge for execution status and workflow status
|
+-- pages/
|     Login.jsx             - login form with role-based redirect on success
|     |
|     admin/
|       AdminDashboard.jsx  - workflow list with search, edit, delete
|       WorkflowEditor.jsx  - create/edit workflow with visual schema builder and step manager
|       RuleEditor.jsx      - rule list per step with condition input and next step dropdown
|       AuditLog.jsx        - full execution history with expandable logs
|       UserManager.jsx     - user list with create, role change, delete
|     |
|     employee/
|       EmployeeDashboard.jsx - workflow list, execute modal, my executions, track modal
|     |
|     manager/
|       ManagerDashboard.jsx  - pending approvals, rejection modal, history tab
|     |
|     ceo/
|       CeoDashboard.jsx      - pending approvals, all executions with full step expansion
|
+-- App.jsx                 - route definitions, RoleRedirect component
+-- main.jsx                - React root render
+-- index.css               - global styles, card, table, button, form group classes
```

---

## Pages and Features

### Login

- Email and password form
- On success, redirects based on role: ADMIN to /, MANAGER to /manager, CEO to /ceo, EMPLOYEE to /executions
- Displays error message on invalid credentials

### AdminDashboard

- Lists all active workflows with name, step count, version, status, and created date
- Search input filters workflows by name in real time
- Edit button navigates to WorkflowEditor
- Delete button soft-deletes the workflow with confirmation

### WorkflowEditor

- Workflow name input
- Visual Input Schema Builder: add fields with name, type (number / string / boolean), required toggle, and comma-separated options for dropdown fields
- Collapsible JSON preview of the generated schema
- Steps table with order, name, type badge, assignee email, start step indicator
- Add Step modal with smart metadata inputs:
  - APPROVAL shows assignee email field
  - NOTIFICATION shows channel dropdown (Email / Slack / SMS)
  - TASK shows description field
- Rules button navigates to RuleEditor for that step
- Set Start button marks a step as the entry point for the workflow

### RuleEditor

- Lists rules for a specific step ordered by priority
- Add or edit rule: priority number, MVEL condition expression, next step dropdown showing step names from the same workflow
- Next step dropdown includes an END option which sets next_step_id to null and completes the workflow
- Informational banner explains DEFAULT keyword usage

### AuditLog

- Full execution table with execution ID, workflow name, version, status, triggered by (name resolved from user list), start and end times
- View Logs expands inline to show each step log entry with step name, type, approver name, comment, and timestamp
- Input data shown as formatted JSON

### UserManager

- Lists all users with name, email, role
- Create user form: name, email, password, role selector
- Role can be changed via dropdown directly in the table row
- Delete user with confirmation

### EmployeeDashboard

- Workflows tab: table of active workflows with Execute button
- Execute modal: dynamic form built from the workflow input schema, supports text, number, and dropdown fields
- After execution starts, modal switches to a confirmation view with current step name and link to My Executions
- My Executions tab: cards per execution showing status badge, Track and Cancel buttons
- Track modal: shows all workflow steps with color-coded state. Green for completed, amber for in progress, red for rejected, grey for not yet reached. Auto-completed NOTIFICATION and TASK steps are marked green based on positional logic

### ManagerDashboard

- Pending Approvals tab: cards showing workflow name, current step, submitter name, submission data as key-value chips, previous step logs with approver names
- Approve and Reject buttons per pending execution
- Reject opens a modal requiring a reason comment before confirming
- My History tab: table of executions the manager has acted on with expandable step logs

### CeoDashboard

- Same approval capabilities as Manager dashboard
- All Executions tab: compact cards for every execution in the system with status, triggered by name, and timestamp
- All Steps button expands a card to show every step in the workflow with real-time state, approver names, comments, and timestamps

---

## API Layer

All API files are in `src/api/`. Axios is configured with:

```js
axios.defaults.withCredentials = true
axios.defaults.baseURL = 'http://localhost:8080'
```

This ensures session cookies are included with every request for authentication.

### authApi.js

```
login(email, password)     POST /api/auth/login
logout()                   POST /api/auth/logout
getMe()                    GET  /api/auth/me
```

### workflowApi.js

```
getAllWorkflows()                GET    /api/workflows
getWorkflowById(id)             GET    /api/workflows/:id
searchWorkflows(name)           GET    /api/workflows/search?name=
createWorkflow(data)            POST   /api/workflows
updateWorkflow(id, data)        PUT    /api/workflows/:id
deleteWorkflow(id)              DELETE /api/workflows/:id
setStartStep(wfId, stepId)      PUT    /api/workflows/:id/start-step/:stepId
```

### stepApi.js

```
getStepsByWorkflow(id)          GET    /api/workflows/:id/steps
addStep(wfId, data)             POST   /api/workflows/:id/steps
updateStep(id, data)            PUT    /api/steps/:id
deleteStep(id)                  DELETE /api/steps/:id
```

### ruleApi.js

```
getRulesByStep(stepId)          GET    /api/steps/:id/rules
addRule(stepId, data)           POST   /api/steps/:id/rules
updateRule(id, data)            PUT    /api/rules/:id
deleteRule(id)                  DELETE /api/rules/:id
```

### ExecutionApi.jsx

```
startExecution(wfId, data)               POST /api/workflows/:id/execute
getExecution(id)                         GET  /api/executions/:id
getAllExecutions()                        GET  /api/executions
getPendingApprovals(email)               GET  /api/executions/pending?email=
approveStep(id, approverId)              POST /api/executions/:id/approve
rejectStep(id, rejectorId, comment)      POST /api/executions/:id/reject
cancelExecution(id)                      POST /api/executions/:id/cancel
retryExecution(id)                       POST /api/executions/:id/retry
```

### userApi.js

```
getAllUsers()                    GET    /api/users
createUser(data)                POST   /api/users
deleteUser(id)                  DELETE /api/users/:id
updateRole(id, role)            PUT    /api/users/:id/role
```

---

## Installation Guide

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- The backend service running at http://localhost:8080

### Step 1 - Clone the repository

```bash
git clone https://github.com/Hallyex-Workflow-Engine/workflow-engine-frontend.git
cd workflow-engine-frontend
```

### Step 2 - Install dependencies

```bash
npm install
```

### Step 3 - Install required packages if not present

```bash
npm install axios react-router-dom
```

### Step 4 - Start the development server

```bash
npm run dev
```

The application will start at `http://localhost:5174`.

### Step 5 - Login with seeded users

| Role | Email | Password |
|---|---|---|
| Admin | admin@company.com | admin123 |
| Manager | manager@company.com | manager123 |
| CEO | ceo@company.com | ceo123 |
| Employee | emp@company.com | emp123 |

---

## Environment Configuration

The backend base URL is set directly in `src/api/authApi.js`:

```js
axios.defaults.baseURL = 'http://localhost:8080'
```

To point to a different backend, update this value. For production builds, consider using an environment variable via a `.env` file:

```
VITE_API_BASE_URL=https://your-backend-domain.com
```

And update the axios configuration to:

```js
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
```

---

## Routing Reference

| Path | Component | Access |
|---|---|---|
| /login | Login | Public |
| / | AdminDashboard | ADMIN only |
| /workflows/new | WorkflowEditor | ADMIN only |
| /workflows/:id/edit | WorkflowEditor | ADMIN only |
| /steps/:stepId/rules | RuleEditor | ADMIN only |
| /audit | AuditLog | ADMIN, CEO |
| /users | UserManager | ADMIN only |
| /executions | EmployeeDashboard | EMPLOYEE only |
| /manager | ManagerDashboard | MANAGER only |
| /ceo | CeoDashboard | CEO only |
| /unauthorized | Unauthorized message | Any authenticated |
| * | Redirect to /login | - |

---

## Global Styles

The `index.css` file defines reusable class names used throughout the application:

| Class | Usage |
|---|---|
| .card | White rounded container with border |
| .btn | Base button style |
| .btn-primary | Indigo filled button |
| .btn-danger | Red filled button |
| .btn-success | Green filled button |
| .form-group | Margin-spaced form field wrapper |
| .label | Small bold form label |
| .page-title | Large bold page heading |

These classes are applied throughout components and can be extended in `index.css` without changing component code.

---

## Organization

Hallyex-Workflow-Engine repositories: https://github.com/Hallyex-Workflow-Engine
