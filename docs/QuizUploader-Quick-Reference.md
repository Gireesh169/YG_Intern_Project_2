# QuizUploader - Quick Reference

## 🚀 Import & Use

```jsx
import QuizUploader from "../components/QuizUploader";

// In your page/parent component:
<QuizUploader />;
```

## 📋 Component Features at a Glance

| Feature              | Status | Details                                |
| -------------------- | ------ | -------------------------------------- |
| File Upload          | ✅     | JSON only, validated                   |
| JSON Parsing         | ✅     | Safe parsing with try-catch            |
| Questions Extraction | ✅     | Uses optional chaining (`?.questions`) |
| Bearer Token         | ✅     | Auto-extracted from session            |
| Error Messages       | ✅     | 8+ specific error types                |
| Loading State        | ✅     | Buttons disabled during upload         |
| Success Feedback     | ✅     | Green success message                  |
| Form Reset           | ✅     | Clear button available                 |

---

## 🔧 Required Setup

### 1. Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. User Must Be Logged In

Component requires active session:

```jsx
import { useAuth } from "../hooks/useAuth"; // Your auth hook

function AdminPanel() {
  const { user } = useAuth();

  if (!user) return <div>Please log in</div>;

  return <QuizUploader />;
}
```

### 3. Supabase Edge Function Deployed

```bash
supabase functions deploy upload-questions
```

---

## 📝 Input/Output

### Input (User provides)

- **File**: JSON file with `{ "questions": [...] }` format
- **Sub-Module ID**: String identifier (e.g., "algebra-101")

### Output (Sent to Edge Function)

```json
{
  "subModuleId": "algebra-101",
  "questions": [
    {
      "text": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1,
      "explanation": "Simple addition",
      "difficulty": "easy"
    }
  ]
}
```

---

## 💾 Optional Chaining Used

```javascript
// File input safety
e?.target?.files?.[0];

// JSON data extraction
jsonData?.questions;

// Message properties
message?.type;
message?.text;

// Session data
session?.access_token;

// Array operations
parsedQuestions?.length;

// Error handling
error?.message;
```

---

## 🎨 Styling

Uses **Tailwind CSS**. Key classes:

- `max-w-md` - Max container width
- `p-6` - Padding
- `rounded-lg` - Border radius
- `shadow-lg` - Drop shadow
- `focus:ring-2 focus:ring-blue-500` - Focus states
- `disabled:opacity-50` - Disabled states
- `bg-green-100` / `bg-red-100` / `bg-yellow-100` - Status colors

---

## 📤 API Call

```javascript
fetch(`${VITE_SUPABASE_URL}/functions/v1/upload-questions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`, // ← Critical!
  },
  body: JSON.stringify({
    subModuleId,
    questions,
  }),
});
```

---

## ⚠️ Error Handling

| Error               | How It's Caught          | User Sees                                              |
| ------------------- | ------------------------ | ------------------------------------------------------ |
| Wrong file type     | File input validation    | "Please upload a valid JSON file"                      |
| Malformed JSON      | `JSON.parse()` try-catch | "JSON parsing error: ..."                              |
| Missing `questions` | Array check              | 'Invalid JSON format. Must contain "questions" array.' |
| Empty questions     | Array length check       | "JSON file contains empty questions array"             |
| No Sub-Module ID    | Input validation         | "Please enter a Sub-Module ID"                         |
| Not logged in       | `getSession()` check     | "No authentication token"                              |
| Network error       | fetch() error            | "Upload failed (4xx/5xx)"                              |
| Server error        | response.json()          | Edge Function error message                            |

---

## 🧪 Test Data

Save as `sample-quiz.json`:

```json
{
  "questions": [
    {
      "text": "What does React.useState return?",
      "options": [
        "A function",
        "An array with state and setter",
        "A component",
        "An object"
      ],
      "correctAnswer": 1,
      "explanation": "useState returns [value, setter] array",
      "difficulty": "easy",
      "category": "React Hooks"
    },
    {
      "text": "What is virtual DOM?",
      "options": [
        "DOM copy in memory",
        "CSS framework",
        "Browser API",
        "Python library"
      ],
      "correctAnswer": 0,
      "explanation": "Virtual DOM is React's in-memory representation of UI",
      "difficulty": "medium",
      "category": "React Concepts"
    }
  ]
}
```

---

## 🔐 Security Checklist

- ✅ Bearer token included in every request
- ✅ Only authenticated users can access
- ✅ File type validated on client
- ✅ JSON validated on client
- ✅ Input sanitized before sending
- ✅ Edge Function validates on server (never trust client)
- ✅ Service role key only on server (not exposed)

---

## 🐛 Common Issues & Fixes

### "Upload fails silently"

**Check**: Browser console for errors  
**Fix**: Ensure user is logged in + Edge Function is deployed

### "401 Unauthorized"

**Check**: Bearer token format  
**Fix**: Ensure `Authorization: Bearer ${token}` (with space)

### "CORS error"

**Check**: Edge Function headers  
**Fix**: Ensure CORS headers are set in Edge Function

### "Empty questions array warning"

**Check**: JSON file content  
**Fix**: Add actual question objects to `questions` array

### "Component doesn't render"

**Check**: React import  
**Fix**: Ensure `import React from "react"`

---

## 📚 Related Files

- [Full Implementation Guide](./QuizUploader-Implementation.md)
- [Test Suite](./QuizUploader.test.js)
- Component: [JSX](../src/components/QuizUploader.jsx) or [TypeScript](../src/components/QuizUploader.tsx)

---

## 🚀 Usage Example in Page

```jsx
import QuizUploader from "../components/QuizUploader";

export default function AdminQuizPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Quiz Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <QuizUploader />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Instructions</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Prepare JSON file with questions</li>
              <li>✓ Enter sub-module identifier</li>
              <li>✓ Upload file</li>
              <li>✓ Click Submit</li>
              <li>✓ Success message confirms upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 📞 Support Checklist

Before troubleshooting, verify:

- [ ] User is logged in
- [ ] JSON file is valid (test in browser console: `JSON.parse(...)`)
- [ ] Sub-Module ID is not empty
- [ ] Environment variables are set correctly
- [ ] Supabase Edge Function is deployed
- [ ] Network tab shows POST request to `/functions/v1/upload-questions`
- [ ] Bearer token is present in request headers
