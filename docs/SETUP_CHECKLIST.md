# QuizChapterUploader - Setup Checklist

## 📋 Pre-Setup Requirements

- [ ] React project with Tailwind CSS configured
- [ ] Supabase account and project created
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] User authenticated (login system implemented)
- [ ] Node.js and npm installed

---

## 📦 Installation Steps

### Step 1: Copy Component File

- [ ] Copy `QuizChapterUploader.jsx` OR `QuizChapterUploader.tsx` to `src/components/`
- [ ] Choose one:
  - `QuizChapterUploader.jsx` if using JavaScript/JSX
  - `QuizChapterUploader.tsx` if using TypeScript

### Step 2: Environment Setup

- [ ] Add to `.env.local`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- [ ] Replace with actual values from Supabase dashboard
- [ ] Restart dev server after adding variables

### Step 3: Create Edge Function

```bash
supabase functions create create_questions_from_file
```

- [ ] Function created locally

### Step 4: Add Edge Function Code

- [ ] Open `supabase/functions/create_questions_from_file/index.ts`
- [ ] Copy Edge Function code from `QuizChapterUploader-Guide.md`
- [ ] Paste into the `index.ts` file
- [ ] Save the file

### Step 5: Deploy Edge Function

```bash
supabase functions deploy create_questions_from_file
```

- [ ] Function deployed to Supabase
- [ ] Check: `supabase functions list` shows function
- [ ] Verify: No errors in deployment output

### Step 6: Import Component

```jsx
import QuizChapterUploader from "../components/QuizChapterUploader";
```

- [ ] Import added to your page/component
- [ ] Component renders without errors
- [ ] Check browser console for import errors

---

## 🧪 Testing Setup

### Test 1: Component Renders

- [ ] Component displays in browser
- [ ] All form fields visible:
  - [ ] Chapter Name input
  - [ ] Difficulty dropdown
  - [ ] File upload input
  - [ ] Submit button
- [ ] No console errors

### Test 2: File Upload

- [ ] File input accepts `.json` files
- [ ] Non-JSON files are rejected
- [ ] Shows error: "Please upload a valid JSON file"

### Test 3: JSON Parsing

Create test file `test.json`:

```json
{
  "questions": [
    {
      "text": "What is 2+2?",
      "options": ["3", "4", "5"],
      "correctAnswer": 1
    }
  ]
}
```

- [ ] Upload test file
- [ ] Should show: "File parsed successfully! Found 1 question(s)"
- [ ] Questions preview visible

### Test 4: Form Validation

- [ ] Submit button disabled initially
- [ ] Submit button enabled after:
  - [ ] File uploaded
  - [ ] Chapter name entered
- [ ] Shows error if chapter name missing
- [ ] Shows error if file not parsed

### Test 5: Authentication

- [ ] Log in to your app first
- [ ] Component shows no auth error
- [ ] Bearer token visible in Network tab (DevTools)

### Test 6: API Request

1. Open DevTools (F12)
2. Go to Network tab
3. Filter to Fetch/XHR
4. Fill form and submit:

- [ ] POST request appears
- [ ] URL contains `/create_questions_from_file`
- [ ] Header: `Authorization: Bearer {token}`
- [ ] Header: `Content-Type: application/json`
- [ ] Payload contains:
  - [ ] `chapterName`
  - [ ] `difficulty`
  - [ ] `questions` array

### Test 7: Success Flow

- [ ] Click submit button
- [ ] Success message appears (green)
- [ ] Form resets (all fields cleared)
- [ ] Check database for created chapter

### Test 8: Error Handling

Test each error scenario:

- [ ] Missing file → "No questions loaded" error
- [ ] Invalid JSON → "JSON parsing error" message
- [ ] Empty array → "Questions array is empty" error
- [ ] No chapter name → "Please enter a Chapter Name" error
- [ ] Not logged in → "No authentication token" error

---

## 🔧 Advanced Setup (Optional)

### Add to Redux Store

- [ ] Create quiz chapter action
- [ ] Add to reducer
- [ ] Dispatch on success for automatic refresh

### Add Callbacks

Modify component to accept:

```jsx
<QuizChapterUploader
  onSuccess={(data) => {
    dispatch(refreshChapters());
  }}
/>
```

### Add Drag-and-Drop

- [ ] Add dragover, drop event handlers
- [ ] Show visual feedback
- [ ] Handle dropped files

### Customize Styling

- [ ] Change colors/fonts
- [ ] Add company branding
- [ ] Make responsive for mobile

### Add File Preview

- [ ] Show first 5 questions before upload
- [ ] Allow editing questions before submit
- [ ] Show question count

### Add Bulk Upload

- [ ] Accept multiple files
- [ ] Show upload progress
- [ ] Handle partial failures

---

## ✅ Pre-Launch Verification

### Code Quality

- [ ] No console errors
- [ ] No console warnings
- [ ] Code formatted nicely
- [ ] Comments added where needed

### Security

- [ ] Bearer token included in requests
- [ ] No credentials exposed in code
- [ ] File validation working
- [ ] JSON validation working

### Performance

- [ ] Large files load quickly
- [ ] Submit button responsive
- [ ] No memory leaks
- [ ] API calls completed successfully

### Testing

- [ ] All happy path tests pass
- [ ] All error paths tested
- [ ] Edge cases handled
- [ ] Manual testing complete

### Documentation

- [ ] Users know how to use component
- [ ] Example JSON provided
- [ ] Error messages clear
- [ ] Help available (docs/guide)

---

## 🚀 Deployment Checklist

### Before Pushing to Git

- [ ] Component files added
- [ ] No local debug code left
- [ ] `.env.local` NOT committed (add to `.gitignore`)
- [ ] Edge Function code tested
- [ ] All tests passing

### Before Deploying to Production

- [ ] Supabase Edge Function deployed to production
- [ ] Environment variables set in production
- [ ] Test upload in production
- [ ] Monitor for errors (24 hours)

### After Deployment

- [ ] Users can access component
- [ ] Uploads working correctly
- [ ] Error messages helpful
- [ ] No support tickets about crashes
- [ ] Performance acceptable

---

## 🐛 Troubleshooting Checklist

### Component Won't Render

- [ ] Component file copied to `src/components/`
- [ ] Import statement correct
- [ ] No typos in filename
- [ ] React imported properly
- [ ] Tailwind CSS configured

### File Upload Not Working

- [ ] File input accepts `.json` files
- [ ] `accept=".json"` attribute present
- [ ] File type validation working
- [ ] Browser console shows no errors

### JSON Parsing Fails

- [ ] JSON syntax valid (use validator)
- [ ] `"questions"` key present
- [ ] Questions is an array: `[]`
- [ ] Array not empty
- [ ] Try with simpler JSON first

### Submit Button Disabled

- [ ] Chapter name entered
- [ ] File parsed successfully
- [ ] Questions preview showing
- [ ] All three required:
  - [ ] chapterName filled
  - [ ] file uploaded
  - [ ] questions array exists

### API Request Fails

- [ ] User is logged in
- [ ] Session token available
- [ ] Bearer token in Network tab
- [ ] Edge Function deployed
- [ ] VITE_SUPABASE_URL correct
- [ ] Network connection working

### Edge Function Not Found

- [ ] Run: `supabase functions list`
- [ ] Function appears in list
- [ ] Run: `supabase functions deploy create_questions_from_file`
- [ ] Check deployment output for errors

### Database Insert Fails

- [ ] Database tables exist
- [ ] Table schema correct
- [ ] Columns match request data
- [ ] Primary keys configured
- [ ] Foreign keys valid

### Bearer Token Invalid

- [ ] User is logged in
- [ ] Session not expired
- [ ] Try logging in again
- [ ] Check Supabase auth settings

---

## 📊 Performance Checklist

- [ ] File upload responsive (no lag)
- [ ] JSON parsing fast (< 1s for typical files)
- [ ] API response quick (< 5s)
- [ ] No memory leaks
- [ ] UI responsive during upload
- [ ] Console free of errors

---

## 📚 Documentation Checklist

- [ ] Users have access to:
  - [ ] QuickRef guide
  - [ ] Full implementation guide
  - [ ] Example page
  - [ ] JSON format examples
- [ ] Instructions easy to follow
- [ ] Error messages helpful
- [ ] Screenshots/diagrams added
- [ ] FAQ section complete

---

## 🎯 Success Criteria

✅ Component is considered successfully deployed when:

1. **Functional**
   - File upload works
   - JSON parsing works
   - API call succeeds
   - Data saved to database
   - Form resets after upload

2. **Safe**
   - No "Cannot read properties" errors
   - Invalid JSON handled gracefully
   - Missing files handled
   - Auth errors clear
   - API errors caught

3. **User-Friendly**
   - Success message shows
   - Error messages clear
   - Process intuitive
   - No hidden requirements
   - Feedback immediate

4. **Reliable**
   - Works consistently
   - No random failures
   - Performance acceptable
   - Handles edge cases
   - Recovers from errors

5. **Documented**
   - Users know how to use it
   - Troubleshooting available
   - Examples provided
   - Common questions answered

---

## 🎉 Congratulations!

You've successfully completed all steps! The component is ready to use.

### Next: Monitor in Production

- [ ] Check logs for errors (first week)
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Make improvements based on feedback
- [ ] Keep documentation updated

### Future Enhancements

Consider adding:

- [ ] Bulk upload (multiple files)
- [ ] Question editing UI
- [ ] Import from URLs
- [ ] CSV file support
- [ ] Progress tracking
- [ ] Duplicate detection
- [ ] Question validation UI

---

## 📞 Support

If issues occur:

1. Check console (F12)
2. Check Network tab (requests)
3. Read error message carefully
4. Check documentation
5. Review troubleshooting guide
6. Try with simple test data
7. Check Supabase logs

---

## ✨ You're Ready to Go!

All checks complete?

**Start using the component now! 🚀**

```jsx
import QuizChapterUploader from "../components/QuizChapterUploader";

export default function AdminPage() {
  return <QuizChapterUploader />;
}
```

Happy coding! 💻
