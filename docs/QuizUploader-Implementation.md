# QuizUploader Component - Implementation Guide

## Component Features

✅ **Safe JSON Parsing** - Uses try-catch with optional chaining to avoid undefined errors  
✅ **File Type Validation** - Only accepts `.json` files  
✅ **Questions Array Extraction** - Uses optional chaining (`?.questions`)  
✅ **Error Handling** - Comprehensive error messages for all scenarios  
✅ **Bearer Token Authentication** - Automatically includes Supabase session token  
✅ **Loading States** - Buttons disabled during upload  
✅ **User Feedback** - Success/error/warning messages with styling

---

## Usage

### Basic Import & Implementation

```jsx
import QuizUploader from "../components/QuizUploader";

export default function AdminPage() {
  return (
    <div>
      <h1>Quiz Management</h1>
      <QuizUploader />
    </div>
  );
}
```

---

## Expected JSON Format

```json
{
  "questions": [
    {
      "id": 1,
      "text": "What is 2 + 2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1,
      "explanation": "Simple addition"
    },
    {
      "id": 2,
      "text": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin"],
      "correctAnswer": 1
    }
  ]
}
```

### Optional Fields

- `explanation` - Optional explanation for each question
- `difficulty` - Optional difficulty level (easy, medium, hard)
- `category` - Optional question category

---

## Supabase Edge Function Setup

### 1. Create Edge Function

```bash
supabase functions create upload-questions
```

### 2. Function Implementation

**File:** `supabase/functions/upload-questions/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
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

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

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
    const { subModuleId, questions } = await req.json();

    // Validate input
    if (!subModuleId?.trim()) {
      return new Response(
        JSON.stringify({ error: "subModuleId is required" }),
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

    // Insert questions into database
    const { data, error: insertError } = await supabase
      .from("questions")
      .insert(
        questions.map((q) => ({
          sub_module_id: subModuleId,
          title: q?.text,
          description: q?.explanation,
          options: q?.options,
          correct_answer: q?.correctAnswer,
          difficulty: q?.difficulty || "medium",
          category: q?.category,
          created_by: user.id,
          created_at: new Date().toISOString(),
        })),
      )
      .select();

    if (insertError) {
      console.error("Database error:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to insert questions",
          details: insertError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully uploaded ${questions.length} questions`,
        count: data?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error?.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
});
```

### 3. Deploy Function

```bash
supabase functions deploy upload-questions
```

---

## Component Props (None - Fully Self-Contained)

The component is fully self-contained and requires no props. It manages all state internally.

---

## Integration Example with Redux

If you want to trigger actions after upload:

```jsx
import { useDispatch } from "react-redux";
import QuizUploader from "../components/QuizUploader";

export default function QuizManagement() {
  const dispatch = useDispatch();

  const handleUploadSuccess = () => {
    dispatch(fetchQuizzesThunk()); // Refresh quiz list
  };

  return <QuizUploader onSuccess={handleUploadSuccess} />;
}
```

---

## Error Messages Handled

| Error                                                    | Cause                   | Solution                    |
| -------------------------------------------------------- | ----------------------- | --------------------------- |
| "Please upload a valid JSON file"                        | Wrong file type         | Use `.json` file            |
| 'Invalid JSON format. Must contain a "questions" array.' | Missing `questions` key | Add `questions: []` to JSON |
| "JSON parsing error: ..."                                | Malformed JSON          | Validate JSON syntax        |
| "Error reading file. Please try again."                  | File read failure       | Try uploading again         |
| "Please enter a Sub-Module ID"                           | Empty sub-module ID     | Enter a valid ID            |
| "No authentication token. Please log in first."          | Not logged in           | Log in to account           |
| "Upload failed (4xx/5xx)"                                | Server error            | Check Edge Function logs    |

---

## Optional Enhancements

### 1. Add Drag & Drop

```jsx
const handleDragOver = (e) => {
  e?.preventDefault?.();
  e?.dataTransfer?.dropEffect = "copy";
};

const handleDrop = (e) => {
  e?.preventDefault?.();
  const files = e?.dataTransfer?.files;
  if (files?.[0]) {
    handleFileChange({ target: { files } });
  }
};

// Add to form:
<form onDragOver={handleDragOver} onDrop={handleDrop}>
```

### 2. Add File Preview

```jsx
{
  parsedQuestions && (
    <details className="mt-2 p-2 bg-gray-50 rounded">
      <summary className="cursor-pointer font-medium">
        Preview Questions
      </summary>
      <div className="mt-2 max-h-48 overflow-y-auto">
        {parsedQuestions?.map((q, idx) => (
          <div key={idx} className="text-xs text-gray-600 mb-2">
            <strong>{idx + 1}.</strong> {q?.text?.substring(0, 50)}...
          </div>
        ))}
      </div>
    </details>
  );
}
```

### 3. Add Batch Upload Progress

Track progress for large files with XMLHttpRequest upload events.

---

## Security Notes

✅ **Token Included** - Bearer token automatically extracted from session  
✅ **CORS Handling** - Edge Function has CORS headers configured  
✅ **Input Validation** - Both client and server validate inputs  
✅ **User Association** - Questions linked to authenticated user  
✅ **Type Checking** - Optional chaining prevents undefined errors

---

## Testing

### Test JSON File

Create `test-quiz.json`:

```json
{
  "questions": [
    {
      "text": "What is React?",
      "options": ["Library", "Framework", "Language"],
      "correctAnswer": 0,
      "difficulty": "easy"
    },
    {
      "text": "What does useState do?",
      "options": ["Manages state", "Creates elements", "Fetches data"],
      "correctAnswer": 0,
      "difficulty": "medium"
    }
  ]
}
```

---

## Troubleshooting

**Q: Upload fails with "No authentication token"**  
A: Ensure user is logged in before uploading. Check `supabase.auth.getSession()`.

**Q: Edge Function returns 401**  
A: Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` for Supabase.

**Q: "questions must be a non-empty array"**  
A: Ensure JSON has format: `{ "questions": [...] }`

**Q: File upload not triggering**  
A: Check browser console. Ensure file input is not disabled by `loading` state.
