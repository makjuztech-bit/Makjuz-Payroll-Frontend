
# AI Live Chat Support Implementation Plan

This document outlines the architecture and implementation plan for adding an AI-powered Live Chat Support system to the Makjuz Payroll software.

## 1. Overview
The goal is to create an intelligent assistant that acts as a payroll expert. It will guide users through the software's features (Employees, Pay Runs, Benefits, Reports), answer questions, and troubleshoot issues.

## 2. Architecture

### A. Backend (Node.js/Express)
*   **AI Provider**: Google Gemini (via `@google/generative-ai` SDK). It provides high-quality reasoning and is cost-effective.
*   **Controller (`aiController.js`)**: Handles chat requests, maintains conversation context (optional/stateless for v1), and prompts the AI.
*   **Service (`aiService.js`)**: Wraps the Gemini API calls. It injects a "System Prompt" that gives the AI its persona and knowledge about the payroll system.
*   **Route (`aiRoutes.js`)**: Exposes `POST /api/chat`.

### B. Frontend (React/Ant Design)
*   **Chat Interface**: A new component replacing the static "Live Chat" card or a floating widget.
*   **Features**:
    *   Chat bubbles (User vs AI).
    *   Typing indicators.
    *   Markdown rendering (for nice lists/formatting).
    *   Quick prompt suggestions (e.g., "How do I run payroll?", "Add new employee").

## 3. Implementation Steps

### Phase 1: Backend Intelligence setup
1.  **Install Dependencies**: `npm install @google/generative-ai` (Done).
2.  **Env Configuration**: Add `GEMINI_API_KEY` to `.env`.
3.  **System Prompt Design**: Create a prompts file containing the "Knowledge Base" of the app.
    *   *Persona*: "You are Makjuz Support, a payroll expert..."
    *   *Skills*: "You know how to calculate PF, ESI, add employees..."
4.  **API Endpoint**: Build the `/api/ai/chat` endpoint.

### Phase 2: Frontend Experience
1.  **Chat Component**: build `ContactSupportChat.tsx` with a split view or modal.
2.  **State Management**: Handle loading states and error handling (e.g., if API key is missing).
3.  **Integration**: Update `SupportPage` to mount the chat component.

### Phase 3: "Perfecting" the Guide (Advanced)
*   **Context Awareness**: (Future) The AI could receive the current page URL to give context-specific help.
*   **Action Buttons**: The AI could respond with buttons like "Click here to Add Employee" that perform router navigation.

## 4. Immediate Action Items
I am proceeding with Phase 1 and 2 immediately.

**Required Action from User:**
Please obtain a Google Gemini API Key (free tier available at [aistudio.google.com](https://aistudio.google.com/)) and add it to `d:\intership\payroll-levivaan\Makjuz-payroll-backend\.env` as:
`GEMINI_API_KEY=your_key_here`
