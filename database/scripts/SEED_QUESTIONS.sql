-- Seed PvP Questions
-- Run this if tables exist but no questions

-- Sample Multiple Choice Questions
INSERT INTO pvp_questions (type, language_id, difficulty, question_text, options, correct_answer, time_limit, points, tags) VALUES
(
  'multiple_choice',
  'javascript',
  'easy',
  'What is the output of: console.log(typeof null)?',
  '[
    {"id": "A", "text": "null"},
    {"id": "B", "text": "object"},
    {"id": "C", "text": "undefined"},
    {"id": "D", "text": "number"}
  ]'::jsonb,
  'B',
  30,
  50,
  ARRAY['javascript', 'basics', 'types']
),
(
  'multiple_choice',
  'javascript',
  'medium',
  'What does the "use strict" directive do in JavaScript?',
  '[
    {"id": "A", "text": "Enables strict mode for better error checking"},
    {"id": "B", "text": "Makes code run faster"},
    {"id": "C", "text": "Disables all warnings"},
    {"id": "D", "text": "Enables ES6 features"}
  ]'::jsonb,
  'A',
  45,
  75,
  ARRAY['javascript', 'strict-mode']
),
(
  'multiple_choice',
  'javascript',
  'easy',
  'Which method is used to add an element to the end of an array?',
  '[
    {"id": "A", "text": "push()"},
    {"id": "B", "text": "pop()"},
    {"id": "C", "text": "shift()"},
    {"id": "D", "text": "unshift()"}
  ]'::jsonb,
  'A',
  30,
  50,
  ARRAY['javascript', 'arrays']
),
(
  'multiple_choice',
  'python',
  'easy',
  'What is the correct way to create a list in Python?',
  '[
    {"id": "A", "text": "list = ()"},
    {"id": "B", "text": "list = []"},
    {"id": "C", "text": "list = {}"},
    {"id": "D", "text": "list = <>"}
  ]'::jsonb,
  'B',
  30,
  50,
  ARRAY['python', 'basics', 'lists']
),
(
  'multiple_choice',
  'python',
  'medium',
  'What does the "pass" statement do in Python?',
  '[
    {"id": "A", "text": "Skips the current iteration"},
    {"id": "B", "text": "Does nothing, acts as a placeholder"},
    {"id": "C", "text": "Exits the function"},
    {"id": "D", "text": "Raises an exception"}
  ]'::jsonb,
  'B',
  45,
  75,
  ARRAY['python', 'control-flow']
)
ON CONFLICT DO NOTHING;

-- Sample Code Challenge
INSERT INTO pvp_questions (
  type, language_id, difficulty, 
  problem_title, problem_description, starter_code, test_cases, solution_code,
  time_limit, points, tags
) VALUES (
  'code_challenge',
  'javascript',
  'easy',
  'Sum of Two Numbers',
  'Write a function that takes two numbers and returns their sum.',
  'function sum(a, b) {
  // Your code here
}',
  '[
    {"input": [2, 3], "expected": 5},
    {"input": [0, 0], "expected": 0},
    {"input": [-1, 1], "expected": 0},
    {"input": [100, 200], "expected": 300}
  ]'::jsonb,
  'function sum(a, b) {
  return a + b;
}',
  180,
  100,
  ARRAY['javascript', 'basics', 'math']
),
(
  'code_challenge',
  'javascript',
  'easy',
  'Reverse String',
  'Write a function that reverses a string.',
  'function reverse(str) {
  // Your code here
}',
  '[
    {"input": ["hello"], "expected": "olleh"},
    {"input": ["world"], "expected": "dlrow"},
    {"input": [""], "expected": ""},
    {"input": ["a"], "expected": "a"}
  ]'::jsonb,
  'function reverse(str) {
  return str.split("").reverse().join("");
}',
  180,
  100,
  ARRAY['javascript', 'strings']
),
(
  'code_challenge',
  'python',
  'easy',
  'Find Maximum',
  'Write a function that returns the maximum number in a list.',
  'def find_max(numbers):
    # Your code here
    pass',
  '[
    {"input": [[1, 2, 3, 4, 5]], "expected": 5},
    {"input": [[10, 5, 8, 3]], "expected": 10},
    {"input": [[-1, -5, -3]], "expected": -1},
    {"input": [[42]], "expected": 42}
  ]'::jsonb,
  'def find_max(numbers):
    return max(numbers)',
  180,
  100,
  ARRAY['python', 'lists', 'basics']
)
ON CONFLICT DO NOTHING;

-- Verify questions were added
SELECT 
  type,
  difficulty,
  CASE 
    WHEN type = 'multiple_choice' THEN question_text
    WHEN type = 'code_challenge' THEN problem_title
  END as title,
  language_id
FROM pvp_questions
ORDER BY type, difficulty;
