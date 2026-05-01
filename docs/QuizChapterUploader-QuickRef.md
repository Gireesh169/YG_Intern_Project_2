# QuizChapterUploader - Quick Reference

## ⚡ One-Minute Setup

1. **Import Component**

   ```jsx
   import QuizChapterUploader from "../components/QuizChapterUploader";
   ```

2. **Use in Your Page**

   ```jsx
   <QuizChapterUploader />
   ```

3. **Set Environment Variables**

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Deploy Edge Function**
   ```bash
   supabase functions create create_questions_from_file
   supabase functions deploy create_questions_from_file
   ```
   (See guide for function code)

---

## 📝 Valid JSON Format

```json
{
  "questions": [
    {
      "text": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3"],
      "correctAnswer": 0,
      "difficulty": "easy"
    }
  ]
}
```

### Required Fields:

- `questions` - array
- `text` - question text
- `options` - array of answer options
- `correctAnswer` - index of correct answer (0-based)

### Optional Fields:

- `difficulty` - "easy", "medium", "hard"
- `explanation` - why answer is correct

---

## 🎯 What It Does

| Action             | Happens                            |
| ------------------ | ---------------------------------- |
| Upload JSON        | Validates file type (`.json` only) |
| File appears       | Shows filename in UI               |
| Parse file         | Automatically parses JSON          |
| Show preview       | Displays "X questions ready"       |
| Enter chapter name | User provides chapter name         |
| Select difficulty  | User picks easy/medium/hard        |
| Click submit       | Sends to Supabase Edge Function    |
| Success            | Shows message, clears form         |

---

## ⚠️ Safety Features (No Crashes!)

**Protected against "Cannot read properties of undefined":**

```javascript
// SAFE - uses optional chaining everywhere
fileName?.toLowerCase?.() || "";
chapterName?.trim?.() || "";
difficulty?.trim?.().toLowerCase?.() || "medium";
jsonData?.questions;
```

---

## 🔐 Security

- ✅ Bearer token auto-included from session
- ✅ File type validated (only `.json`)
- ✅ JSON validated before sending
- ✅ User must be logged in
- ✅ Questions array checked
- ✅ Server-side validation in Edge Function

---

## 🛠️ Component Structure

```
QuizChapterUploader
├── States (React.useState)
│   ├── chapterName
│   ├── difficulty
│   ├── file
│   ├── fileName
│   ├── loading
│   ├── message
│   └── parsedQuestions
├── Handlers
│   ├── handleFileChange() - Parse JSON
│   └── handleSubmit() - Send to API
└── UI
    ├── Chapter Name Input
    ├── Difficulty Dropdown
    ├── File Upload Input
    ├── Questions Preview
    ├── Submit Button
    └── Message Display
```

---

## 🐛 Troubleshooting

### "Cannot read properties of undefined"

- **Cause**: Direct access without checking (e.g., `name.toLowerCase()`)
- **Fix**: Component uses safe checks - use provided component as-is

### "Upload fails silently"

1. Check browser console for errors
2. Verify user is logged in
3. Check Bearer token in Network tab
4. Verify Edge Function is deployed

### "JSON parsing error"

- File has invalid JSON syntax
- Fix: Save JSON with syntax checker
- Test: `JSON.parse(jsonString)` in console

### "Questions array is empty"

- JSON file has `{ "questions": [] }`
- Fix: Add question objects to array

### "No authentication token"

- User not logged in
- Fix: Ensure user logs in before accessing component

### "API Error (401)"

- Bearer token is wrong or expired
- Fix: Check Supabase session, refresh if needed

### "API Error (400)"

- Bad request (missing fields)
- Fix: Check all required fields in request body

---

## 📊 Input Validation Flow

```
File Upload
    ↓
File exists? → NO → Reset state
    ↓ YES
Is .json? → NO → Show error
    ↓ YES
Parse JSON → Error? → Show error
    ↓ Success
Extract questions → Not array? → Show error
    ↓ YES
Empty? → Show error
    ↓ YES, Non-empty
Show preview ✅
```

---

## 💾 API Call Format

```javascript
POST /functions/v1/create_questions_from_file

Headers:
  Authorization: Bearer {token}
  Content-Type: application/json

Body: {
  "chapterName": "Algebra Basics",
  "difficulty": "medium",
  "questions": [
    {
      "text": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1
    }
  ]
}
```

---

## 📱 UI Elements

| Element       | Type            | State                           |
| ------------- | --------------- | ------------------------------- |
| Chapter Name  | Input text      | Disabled while loading          |
| Difficulty    | Select dropdown | Disabled while loading          |
| File Input    | File upload     | Accept `.json` only             |
| Submit Button | Button          | Disabled if invalid form        |
| Clear Button  | -               | Not shown (use browser refresh) |
| Messages      | Div             | Success/error/warning           |

---

## ✅ Pre-Deployment Checklist

- [ ] JSX or TSX version saved in `src/components/`
- [ ] Supabase Edge Function code created
- [ ] Edge Function deployed: `supabase functions deploy`
- [ ] `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Test JSON file prepared
- [ ] Component renders in dev server
- [ ] Console has no errors
- [ ] User is logged in before testing
- [ ] Network tab shows POST to Edge Function
- [ ] Authorization header present in request
- [ ] Response shows success message

---

## 🧪 Test Steps

1. **Prepare test JSON** (save as `test-questions.json`)

   ```json
   {
     "questions": [
       {
         "text": "Test Q1?",
         "options": ["A", "B"],
         "correctAnswer": 0
       }
     ]
   }
   ```

2. **Log in to app**

3. **Load QuizChapterUploader component**

4. **Enter chapter name** (e.g., "Test Chapter")

5. **Select difficulty** (e.g., "Medium")

6. **Upload test-questions.json**

7. **Should see** "File parsed successfully! Found 1 question(s)"

8. **Click submit**

9. **Should see** "✅ Successfully created chapter "Test Chapter" with 1 question(s)!"

10. **Form resets** (all fields cleared)

---

## 🔗 Files Created

- **JSX**: `src/components/QuizChapterUploader.jsx` - Use this
- **TSX**: `src/components/QuizChapterUploader.tsx` - Use if TypeScript
- **Guide**: `docs/QuizChapterUploader-Guide.md` - Full docs
- **Reference**: This file - Quick lookup

---

## 💡 Tips

- Component handles all error checking - don't add `.toLowerCase()` calls elsewhere
- Always use optional chaining (`?.`) when accessing nested values
- Edge Function should validate input again (never trust client)
- Test with real JSON file, not just console copy-paste
- Check browser console for request payload before reporting issues
- Use Network tab to verify Bearer token format

---

## 🚀 Example Usage in Page

```jsx
import QuizChapterUploader from "../components/QuizChapterUploader";

export default function AdminQuizPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Quiz Chapter</h1>

        <QuizChapterUploader />

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h2 className="font-bold mb-2">How to use:</h2>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Prepare JSON file with questions</li>
            <li>Enter chapter name</li>
            <li>Select difficulty level</li>
            <li>Upload JSON file</li>
            <li>Click "Create Chapter with Questions"</li>
            <li>Success! Chapter created</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
```

---

## 📞 Common Questions

**Q: Can I upload multiple files?**  
A: No, upload one file at a time. Component resets after each upload.

**Q: Can I edit chapter name after creation?**  
A: No, edit in database directly or create new chapter.

**Q: What if Bearer token expires?**  
A: Component will show "No authentication token". User needs to log in again.

**Q: Does component work without internet?**  
A: No, requires connection to Supabase.

**Q: Can I add more fields to questions?**  
A: Yes, JSON can have additional fields. They're included in request body.

**Q: What's the max file size?**  
A: Limited by Supabase (usually 50MB). Edge Functions have request size limits.
