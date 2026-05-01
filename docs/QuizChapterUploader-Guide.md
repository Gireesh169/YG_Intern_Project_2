# QuizChapterUploader - Implementation Guide

## 📋 Overview

Complete React component for uploading JSON files containing quiz questions to Supabase. Includes safety checks to prevent "Cannot read properties of undefined" errors.

---

## 🚀 Quick Start

### Import Component

```jsx
import QuizChapterUploader from "../components/QuizChapterUploader";

export default function AdminPage() {
  return <QuizChapterUploader />;
}
```

### Expected JSON Format

```json
{
  "questions": [
    {
      "text": "What is 2 + 2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1,
      "difficulty": "easy",
      "explanation": "Basic arithmetic"
    },
    {
      "text": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin"],
      "correctAnswer": 1,
      "difficulty": "medium"
    }
  ]
}
```

---

## ✨ Key Features

| Feature                  | Details                                           |
| ------------------------ | ------------------------------------------------- |
| **Chapter Name Input**   | User enters chapter name (e.g., "Algebra Basics") |
| **Difficulty Selector**  | Dropdown: Easy, Medium, Hard                      |
| **JSON File Upload**     | Accept only `.json` files                         |
| **Safe Parsing**         | No `.toLowerCase()` on undefined values           |
| **Questions Extraction** | Uses optional chaining: `jsonData?.questions`     |
| **Validation**           | Checks file, JSON format, questions array         |
| **Bearer Token Auth**    | Auto-includes from Supabase session               |
| **Loading State**        | Buttons disabled during upload                    |
| **Error Messages**       | 7+ specific error types                           |
| **Success Feedback**     | Displays success message + clears form            |
| **Console Logging**      | Debug info in browser console                     |

---

## 🔒 Safety Features

### Protected Against "Cannot read properties of undefined"

**❌ UNSAFE:**

```javascript
filename.toLowerCase(); // Crashes if filename is undefined
```

**✅ SAFE:**

```javascript
filename?.toLowerCase?.() || ""; // Uses optional chaining
```

### All Safe Checks in Component

1. **File extension check:**

   ```javascript
   const nameExtension = selectedFile?.name?.slice?.(-5) || "";
   const isJsonFile = nameExtension?.toLowerCase?.() === ".json";
   ```

2. **Chapter name validation:**

   ```javascript
   const safeChapterName = chapterName?.trim?.() || "";
   ```

3. **Difficulty validation:**

   ```javascript
   const safeDifficulty = difficulty?.trim?.().toLowerCase?.() || "medium";
   ```

4. **Questions array extraction:**
   ```javascript
   const questionsArray = jsonData?.questions; // Safely undefined if missing
   if (!Array.isArray(questionsArray)) {
     /* error */
   }
   ```

---

## 📤 API Integration

### Endpoint

```
POST /functions/v1/create_questions_from_file
```

### Request Headers

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {access_token}"
}
```

### Request Body

```javascript
{
  "chapterName": "Algebra Basics",
  "difficulty": "medium",
  "questions": [
    {
      "text": "Question?",
      "options": ["A", "B"],
      "correctAnswer": 0
    }
  ]
}
```

---

## 🛠 Setup Steps

### 1. Environment Variables

Add to `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Create Edge Function

```bash
supabase functions create create_questions_from_file
```

### 3. Deploy Function

See **Edge Function Code** section below, then:

```bash
supabase functions deploy create_questions_from_file
```

### 4. Ensure User is Logged In

```jsx
import { useAuth } from "../hooks/useAuth";

function AdminPage() {
  const { user } = useAuth();
  if (!user) return <div>Please log in</div>;

  return <QuizChapterUploader />;
}
```

---

## 🔧 Edge Function Code

Create file: `supabase/functions/create_questions_from_file/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify JWT token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Parse request body
    const { chapterName, difficulty, questions } = await req.json();

    // Validate inputs
    if (!chapterName?.trim()) {
      return new Response(
        JSON.stringify({ error: "chapterName is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const validDifficulties = ["easy", "medium", "hard"];
    if (!validDifficulties.includes(difficulty?.toLowerCase?.())) {
      return new Response(
        JSON.stringify({ error: "Invalid difficulty level" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "questions must be a non-empty array" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Create chapter
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .insert({
        name: chapterName?.trim(),
        difficulty: difficulty?.toLowerCase?.(),
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (chapterError) {
      console.error("Chapter creation error:", chapterError);
      return new Response(
        JSON.stringify({ error: "Failed to create chapter" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Insert questions
    const questionData = questions.map((q) => ({
      chapter_id: chapter?.id,
      title: q?.text,
      options: q?.options,
      correct_answer: q?.correctAnswer,
      explanation: q?.explanation,
      difficulty: q?.difficulty || difficulty?.toLowerCase?.(),
      created_by: user.id,
      created_at: new Date().toISOString(),
    }));

    const { data: insertedQuestions, error: questionsError } = await supabase
      .from("questions")
      .insert(questionData)
      .select();

    if (questionsError) {
      console.error("Questions insertion error:", questionsError);
      return new Response(
        JSON.stringify({ error: "Failed to insert questions" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created chapter "${chapterName}" with ${questions.length} question(s)`,
        chapter: chapter,
        questionsCount: insertedQuestions?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
```

---

## 📊 Error Messages Handled

| Error                   | Cause                | User Sees                                                         |
| ----------------------- | -------------------- | ----------------------------------------------------------------- |
| File not JSON           | Wrong file type      | "Please upload a valid JSON file"                                 |
| Invalid JSON            | Malformed syntax     | "JSON parsing error: {details}"                                   |
| Missing questions array | No `"questions"` key | "Invalid JSON format. Missing 'questions' array."                 |
| Empty questions array   | 0 questions          | "Questions array is empty. Please add at least one question."     |
| No chapter name         | Empty input          | "Please enter a Chapter Name"                                     |
| Invalid difficulty      | Not easy/medium/hard | "Please select a valid difficulty level"                          |
| No questions loaded     | File not parsed yet  | "No questions loaded. Please upload and parse a JSON file first." |
| Not logged in           | Missing session      | "No authentication token found. Please log in first."             |
| API error               | Server rejection     | "API Error: {details}"                                            |

---

## 🔍 Debugging

### Check Console Output

Component logs to console:

```
📋 Parsed X questions from file
📤 Sending request to Edge Function:
Body: { chapterName, difficulty, questions }
📥 Response from Edge Function: {...}
```

### Enable Debug Mode

In development, see extra info:

```
Debug: Check browser console for request details
```

### Inspect Request in DevTools

1. Open DevTools → Network tab
2. Upload file and submit
3. Find POST to `create_questions_from_file`
4. Check Headers → Authorization is set
5. Check Payload → chapterName, difficulty, questions are present

---

## ✅ Validation Checklist

Before deploying:

- [ ] Supabase Edge Function is deployed
- [ ] `VITE_SUPABASE_URL` set in `.env.local`
- [ ] `VITE_SUPABASE_ANON_KEY` set in `.env.local`
- [ ] User authentication is working
- [ ] Test JSON file has correct format
- [ ] Component renders without errors
- [ ] No "Cannot read properties" errors in console
- [ ] Bearer token is included in requests
- [ ] File upload works
- [ ] JSON parsing works
- [ ] Form submits successfully
- [ ] Success message displays

---

## 🎨 UI Components

### Chapter Name Input

- Text input field
- Placeholder: "e.g., Algebra Basics"
- Disabled during upload

### Difficulty Selector

- Dropdown with 3 options:
  - 🟢 Easy
  - 🟡 Medium
  - 🔴 Hard

### File Upload

- Accept only `.json` files
- Shows selected filename
- Disabled during upload

### Submit Button

- Text: "Create Chapter with Questions"
- Icon: 🚀
- Disabled until valid form
- Shows "Creating Chapter..." while loading

### Messages

- **Success (green)**: "✅ Successfully created chapter..."
- **Error (red)**: "❌ {error message}"
- **Warning (yellow)**: Not used but available

### Questions Preview

- Shows count: "✓ Ready to upload: X question(s)"
- Only visible after file parsed

---

## 📝 Component Props

**None** - component is fully self-contained with internal state management.

To add callbacks:

```jsx
// Modify component to accept optional props:
interface Props {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

// Then call: props.onSuccess?.(result);
```

---

## 🧪 Test Data

```json
{
  "questions": [
    {
      "text": "What is React?",
      "options": ["A library", "A framework", "A language", "A database"],
      "correctAnswer": 0,
      "difficulty": "easy",
      "explanation": "React is a JavaScript library for building UIs"
    },
    {
      "text": "What does useState return?",
      "options": ["A function", "An array", "An object", "A component"],
      "correctAnswer": 1,
      "difficulty": "medium",
      "explanation": "useState returns [value, setter] array"
    },
    {
      "text": "What is a custom hook?",
      "options": [
        "React hook",
        "Custom code using hooks",
        "Special library",
        "CSS hook"
      ],
      "correctAnswer": 1,
      "difficulty": "hard"
    }
  ]
}
```

---

## 🔄 Component Workflow

```
User enters Chapter Name
        ↓
User selects Difficulty
        ↓
User uploads JSON file
        ↓
File parsed → Questions extracted → Preview shown
        ↓
User clicks "Create Chapter with Questions"
        ↓
Get session token
        ↓
POST to Edge Function with Bearer token
        ↓
Edge Function creates chapter + inserts questions
        ↓
Response received
        ↓
Success message + Form reset
```
