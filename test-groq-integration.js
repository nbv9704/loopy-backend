/**
 * Test script for Groq AI Integration
 * Tests the auto-grading system with a real submission
 */

async function testGroqIntegration() {
  console.log('🧪 Testing Groq AI Integration...\n')

  try {
    // Use a known exercise ID with auto-grading enabled
    // This is the "Thông dịch (JS) vs Biên dịch (C++)" exercise
    const exerciseId = 'aecb7ce1-568f-4586-9e3f-42a9f922f343'
    const language = 'javascript'

    console.log('1️⃣  Using exercise ID:', exerciseId)
    console.log(`   Language: ${language}\n`)

    // 2. Prepare test code
    const testCode = `function add(a, b) {
  // Simple addition function with validation
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

function multiply(a, b) {
  // Multiplication using repeated addition
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  
  let result = 0;
  const absB = Math.abs(b);
  
  for (let i = 0; i < absB; i++) {
    result = add(result, a);
  }
  
  // Handle negative multiplier
  return b < 0 ? -result : result;
}

// Test the functions
console.log('Testing add function:');
console.log(add(2, 3));        // 5
console.log(add(-5, 10));      // 5
console.log(add(0, 100));      // 100

console.log('\\nTesting multiply function:');
console.log(multiply(4, 5));   // 20
console.log(multiply(3, -4));  // -12
console.log(multiply(-2, -3)); // 6`

    console.log('2️⃣  Submitting code for grading...')
    console.log(`   Code length: ${testCode.length} characters\n`)

    // 3. Submit to grading API
    const response = await fetch(`http://localhost:3000/api/grading/exercises/${exerciseId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: testCode,
        language: language,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    console.log('3️⃣  Grading completed!\n')
    console.log('📊 Raw Response:')
    console.log(JSON.stringify(result, null, 2))
    console.log('\n' + '─'.repeat(60))

    if (result.success) {
      const { data } = result

      // Test results
      console.log('\n🧪 Test Results:')
      console.log(`   Passed: ${data.testResults.passed}/${data.testResults.total}`)
      console.log(`   Failed: ${data.testResults.failed}`)

      // AI Analysis
      if (data.aiAnalysis) {
        console.log('\n🤖 AI Analysis (Groq):')
        console.log(`   AI Score: ${data.aiAnalysis.aiScore}/100`)
        console.log(`   Code Quality: ${data.aiAnalysis.scores.codeQuality}/100`)
        console.log(`   Best Practices: ${data.aiAnalysis.scores.bestPractices}/100`)
        console.log(`   Complexity: ${data.aiAnalysis.scores.complexity}/100`)
        console.log(`   Security: ${data.aiAnalysis.scores.security}/100`)

        console.log('\n💪 Strengths:')
        data.aiAnalysis.strengths.forEach((s, i) => console.log(`   ${i + 1}. ${s}`))

        console.log('\n📈 Improvements:')
        data.aiAnalysis.improvements.forEach((s, i) => console.log(`   ${i + 1}. ${s}`))

        console.log('\n💡 Suggestions:')
        data.aiAnalysis.suggestions.forEach((s, i) => console.log(`   ${i + 1}. ${s}`))

        console.log('\n📝 Feedback:')
        const feedback = data.aiAnalysis.feedback
        const lines = feedback.split('\n')
        lines.forEach(line => console.log(`   ${line}`))
      }

      // Final score
      console.log('\n🎯 Final Score:')
      console.log(`   ${data.finalScore}/100`)

      console.log('\n' + '─'.repeat(60))
      console.log('✅ Test completed successfully!')
      console.log('\n💡 Now check backend logs to verify Groq was used:')
      console.log('   Look for: "Using Groq AI for analysis" or "Groq AI analysis completed"')
    } else {
      console.log('❌ Grading failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.cause) console.error('Cause:', error.cause)
  }
}

// Run the test
testGroqIntegration()
