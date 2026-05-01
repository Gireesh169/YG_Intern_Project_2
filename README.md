# YG_Intern_Project_2

Yugyatra learning platform built with React + Vite, focused on quiz-based learning, analytics, and student progress tracking.

## Features

- Authentication and route protection
  - Google sign-in support
  - Private/admin route guards for restricted pages

- Quiz engine with multiple question types
  - MCQ and single-answer objective questions
  - Match-the-following question support
  - Per-question timing, answer tracking, and correctness evaluation

- Quiz submission and persistence
  - Quiz attempt analytics submission flow
  - Resilient fallback behavior when backend/edge calls fail
  - Local persistence fallback for critical quiz attempt data

- Quiz analysis and review
  - Post-quiz analysis view (correct/incorrect breakdown)
  - Per-question explanation and context rendering
  - Null-safe rendering for incomplete explanation fields

- Quiz history
  - Live quiz history loading from analytics APIs
  - Auto-refresh polling for near real-time updates
  - Local history fallback and merge strategy for reliability

- Analytics dashboard
  - Overall stats (attempted, correct, incorrect, accuracy)
  - Subject/module/chapter level visual analytics components
  - Canonical analytics normalization and fallback chain

- Visualization components
  - Stats cards
  - Line and bar charts
  - Subject/chapter progress visualization
  - Heatmap and highlight-based performance components

- Teacher and admin support modules
  - Admin route and delete confirmation workflow
  - Teacher/dashboard pages and analytics views

- Utility and validation layer
  - Quiz data validation utilities
  - Difficulty config and parser helpers
  - Theme, sound, and helper utilities

## Project Structure (High Level)

- `src/pages/` - Main page-level screens (Dashboard, QuizInterface, QuizHistory, Analytics, etc.)
- `src/components/` - Reusable UI and feature components
- `src/services/` - API and Supabase service integrations
- `src/slices/` - Redux slices for state management
- `src/utils/` - Shared utility functions and validators

## Tech Stack

- React (Vite)
- Redux Toolkit
- Supabase (auth, data, edge integration)
- Tailwind CSS

## Run Locally

```bash
npm install
npm run dev
```
# YG_Intern_Project_2_Main
