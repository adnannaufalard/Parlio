# Migration Guide: Correct Answer Format

## 📋 Problem
- **Old format**: `correct_answer` column stores the actual answer text (e.g., "Paris", "Bonjour")
- **New format**: `correct_answer` should store the letter key (e.g., "A", "B", "C", "D")

## ✅ Solution Implemented

### **Backward Compatible Approach**
The code now handles **BOTH formats automatically**:

1. **For existing data** (correct_answer = text):
   - Code will find the matching option key (A/B/C/D) by comparing text
   - Fallback: Extract from `options` array where `is_correct: true`

2. **For new data** (correct_answer = A/B/C/D):
   - Works directly without conversion

### **Code Logic**
```javascript
// Step 1: Check if correct_answer is already A/B/C/D
if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(correctAnswerKey)) {
  // Step 2: It's text, find the key from options
  const foundKey = Object.entries(parsedOptions).find(
    ([key, value]) => value === correctAnswerKey
  )?.[0]
}

// Step 3: If still not found, extract from is_correct flag in options array
if (!correctAnswerKey && Array.isArray(rawOptions)) {
  const correctOption = rawOptions.findIndex(opt => opt.is_correct === true)
  correctAnswerKey = letters[correctOption]
}
```

## 🔧 Optional: Database Migration

If you want to **standardize all data** to the new format (A/B/C/D), run this SQL:

### **Option 1: Migration Script (Recommended if data is consistent)**

```sql
-- Backup table first!
CREATE TABLE questions_backup AS SELECT * FROM questions;

-- Update correct_answer to letter format for multiple_choice questions
UPDATE questions q
SET correct_answer = (
  SELECT 
    CASE 
      WHEN options->0->>'is_correct' = 'true' THEN 'A'
      WHEN options->1->>'is_correct' = 'true' THEN 'B'
      WHEN options->2->>'is_correct' = 'true' THEN 'C'
      WHEN options->3->>'is_correct' = 'true' THEN 'D'
      WHEN options->4->>'is_correct' = 'true' THEN 'E'
      WHEN options->5->>'is_correct' = 'true' THEN 'F'
      ELSE q.correct_answer
    END
  FROM questions WHERE id = q.id
)
WHERE question_type = 'multiple_choice'
AND correct_answer NOT IN ('A', 'B', 'C', 'D', 'E', 'F');

-- Verify changes
SELECT 
  id, 
  question_text, 
  correct_answer, 
  options 
FROM questions 
WHERE question_type = 'multiple_choice' 
LIMIT 10;
```

### **Option 2: Safer Migration with Validation**

```sql
-- Check which questions need migration
SELECT 
  id,
  question_text,
  correct_answer,
  options,
  CASE 
    WHEN options->0->>'text' = correct_answer THEN 'A'
    WHEN options->1->>'text' = correct_answer THEN 'B'
    WHEN options->2->>'text' = correct_answer THEN 'C'
    WHEN options->3->>'text' = correct_answer THEN 'D'
    WHEN options->4->>'text' = correct_answer THEN 'E'
    WHEN options->5->>'text' = correct_answer THEN 'F'
    ELSE '⚠️ NOT FOUND'
  END as new_correct_answer
FROM questions
WHERE question_type = 'multiple_choice'
AND correct_answer NOT IN ('A', 'B', 'C', 'D', 'E', 'F')
ORDER BY id;

-- If validation looks good, apply migration:
UPDATE questions q
SET correct_answer = (
  CASE 
    WHEN options->0->>'text' = q.correct_answer THEN 'A'
    WHEN options->1->>'text' = q.correct_answer THEN 'B'
    WHEN options->2->>'text' = q.correct_answer THEN 'C'
    WHEN options->3->>'text' = q.correct_answer THEN 'D'
    WHEN options->4->>'text' = q.correct_answer THEN 'E'
    WHEN options->5->>'text' = q.correct_answer THEN 'F'
    ELSE q.correct_answer
  END
)
WHERE question_type = 'multiple_choice'
AND correct_answer NOT IN ('A', 'B', 'C', 'D', 'E', 'F');
```

### **Option 3: Manual Update Template**

For manual updates per question:

```sql
-- Template for single question update
UPDATE questions 
SET correct_answer = 'A'  -- Change to correct letter
WHERE id = 1;  -- Change to question ID
```

## 📊 Verification Queries

### Check current format distribution:
```sql
SELECT 
  question_type,
  COUNT(*) as total,
  COUNT(CASE WHEN correct_answer IN ('A','B','C','D','E','F') THEN 1 END) as using_letter_format,
  COUNT(CASE WHEN correct_answer NOT IN ('A','B','C','D','E','F') THEN 1 END) as using_text_format
FROM questions
GROUP BY question_type;
```

### Find questions with mismatched correct_answer:
```sql
SELECT 
  id,
  question_text,
  correct_answer,
  options
FROM questions
WHERE question_type = 'multiple_choice'
AND correct_answer NOT IN (
  options->0->>'text',
  options->1->>'text',
  options->2->>'text',
  options->3->>'text'
);
```

## 🎯 Recommendations

### **Option A: Keep Both Formats (Current Implementation)**
✅ No migration needed
✅ Backward compatible
✅ No data loss risk
✅ Works immediately
⚠️ Code is slightly more complex

**Best for:**
- Production systems with existing data
- When you're not sure about data consistency
- Quick implementation needed

### **Option B: Migrate to Letter Format**
✅ Cleaner data structure
✅ Easier to understand
✅ Standardized format
⚠️ Requires careful migration
⚠️ Risk of data corruption if not done carefully

**Best for:**
- New systems or staging environment
- When you have time to test thoroughly
- Want cleaner long-term maintainability

## 🚀 Recommended Steps

1. **Test current code first** - It should work with existing data
2. **Verify in console** - Check the console.log output when submitting quests
3. **If working well** - Keep as is (Option A)
4. **If you want to standardize**:
   - Backup database first
   - Run verification queries
   - Test migration on staging
   - Apply to production
   - Update teacher input forms to use letter format

## 📝 Future: Teacher Question Input

When creating new questions, teachers should input:
```javascript
// New format (recommended)
{
  question_text: "Apa ibu kota Prancis?",
  options: [
    {text: "Paris", is_correct: false},
    {text: "London", is_correct: false},
    {text: "Berlin", is_correct: false},
    {text: "Madrid", is_correct: false}
  ],
  correct_answer: "A"  // ← Just store the letter
}
```

The `is_correct` flag can remain for validation but is not required for checking answers.
