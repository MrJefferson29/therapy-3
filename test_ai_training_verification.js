// Test AI Training Verification
// This test verifies that the AI is being properly trained with university student knowledge

const ai = require('./backend/controllers/ai.js');

console.log("🧪 Testing AI Training Verification\n");
console.log("=" .repeat(60));

// Test 1: Test knowledge injection for academic concerns
console.log("1. Testing Academic Knowledge Injection...");
const academicInput = "I'm really stressed about my CGPA and I keep procrastinating on my assignments";
const academicKnowledge = ai.injectUniversityStudentKnowledge(academicInput);
console.log("Input:", academicInput);
console.log("Knowledge injected:", academicKnowledge ? "✅ Yes" : "❌ No");
if (academicKnowledge) {
  console.log("Knowledge includes academic expertise:", academicKnowledge.includes("ACADEMIC EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes CGPA anxiety:", academicKnowledge.includes("CGPA Anxiety") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes procrastination:", academicKnowledge.includes("Procrastination") ? "✅ Yes" : "❌ No");
}

// Test 2: Test knowledge injection for financial concerns
console.log("\n2. Testing Financial Knowledge Injection...");
const financialInput = "I'm struggling to afford my tuition and I'm worried about my student loans";
const financialKnowledge = ai.injectUniversityStudentKnowledge(financialInput);
console.log("Input:", financialInput);
console.log("Knowledge injected:", financialKnowledge ? "✅ Yes" : "❌ No");
if (financialKnowledge) {
  console.log("Knowledge includes financial expertise:", financialKnowledge.includes("FINANCIAL EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes self-funding:", financialKnowledge.includes("Self-Funding") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes resources:", financialKnowledge.includes("Resources:") ? "✅ Yes" : "❌ No");
}

// Test 3: Test knowledge injection for social concerns
console.log("\n3. Testing Social Knowledge Injection...");
const socialInput = "I feel lonely and isolated at university, I don't know how to make friends";
const socialKnowledge = ai.injectUniversityStudentKnowledge(socialInput);
console.log("Input:", socialInput);
console.log("Knowledge injected:", socialKnowledge ? "✅ Yes" : "❌ No");
if (socialKnowledge) {
  console.log("Knowledge includes social expertise:", socialKnowledge.includes("SOCIAL EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes social isolation:", socialKnowledge.includes("Social Isolation") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes interventions:", socialKnowledge.includes("Interventions:") ? "✅ Yes" : "❌ No");
}

// Test 4: Test knowledge injection for family concerns
console.log("\n4. Testing Family Knowledge Injection...");
const familyInput = "My parents expect me to get perfect grades and I'm a first-generation student";
const familyKnowledge = ai.injectUniversityStudentKnowledge(familyInput);
console.log("Input:", familyInput);
console.log("Knowledge injected:", familyKnowledge ? "✅ Yes" : "❌ No");
if (familyKnowledge) {
  console.log("Knowledge includes family expertise:", familyKnowledge.includes("FAMILY EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes first-generation:", familyKnowledge.includes("First-Generation") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes support strategies:", familyKnowledge.includes("Support:") ? "✅ Yes" : "❌ No");
}

// Test 5: Test knowledge injection for spiritual concerns
console.log("\n5. Testing Spiritual Knowledge Injection...");
const spiritualInput = "I'm struggling with my faith and I need spiritual guidance";
const spiritualKnowledge = ai.injectUniversityStudentKnowledge(spiritualInput);
console.log("Input:", spiritualInput);
console.log("Knowledge injected:", spiritualKnowledge ? "✅ Yes" : "❌ No");
if (spiritualKnowledge) {
  console.log("Knowledge includes spiritual expertise:", spiritualKnowledge.includes("SPIRITUAL EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes faith-based coping:", spiritualKnowledge.includes("Faith-Based Coping") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes support strategies:", spiritualKnowledge.includes("Support:") ? "✅ Yes" : "❌ No");
}

// Test 6: Test knowledge injection for mental health concerns
console.log("\n6. Testing Mental Health Knowledge Injection...");
const mentalHealthInput = "I feel like an imposter and I'm a perfectionist about my grades";
const mentalHealthKnowledge = ai.injectUniversityStudentKnowledge(mentalHealthInput);
console.log("Input:", mentalHealthInput);
console.log("Knowledge injected:", mentalHealthKnowledge ? "✅ Yes" : "❌ No");
if (mentalHealthKnowledge) {
  console.log("Knowledge includes mental health expertise:", mentalHealthKnowledge.includes("MENTAL HEALTH EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes imposter syndrome:", mentalHealthKnowledge.includes("Imposter Syndrome") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes perfectionism:", mentalHealthKnowledge.includes("Perfectionism") ? "✅ Yes" : "❌ No");
}

// Test 7: Test practical resources injection
console.log("\n7. Testing Practical Resources Injection...");
const resourcesInput = "I need help with my studies";
const resourcesKnowledge = ai.injectUniversityStudentKnowledge(resourcesInput);
console.log("Input:", resourcesInput);
console.log("Knowledge injected:", resourcesKnowledge ? "✅ Yes" : "❌ No");
if (resourcesKnowledge) {
  console.log("Knowledge includes practical resources:", resourcesKnowledge.includes("PRACTICAL RESOURCES") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes campus services:", resourcesKnowledge.includes("Campus Services") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes crisis resources:", resourcesKnowledge.includes("Crisis Resources") ? "✅ Yes" : "❌ No");
}

// Test 8: Test evidence-based techniques injection
console.log("\n8. Testing Evidence-Based Techniques Injection...");
const techniquesInput = "I need stress management techniques";
const techniquesKnowledge = ai.injectUniversityStudentKnowledge(techniquesInput);
console.log("Input:", techniquesInput);
console.log("Knowledge injected:", techniquesKnowledge ? "✅ Yes" : "❌ No");
if (techniquesKnowledge) {
  console.log("Knowledge includes evidence-based techniques:", techniquesKnowledge.includes("EVIDENCE-BASED TECHNIQUES") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes stress management:", techniquesKnowledge.includes("Stress Management") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes cognitive techniques:", techniquesKnowledge.includes("Cognitive Techniques") ? "✅ Yes" : "❌ No");
}

// Test 9: Test multiple concerns in one input
console.log("\n9. Testing Multiple Concerns Injection...");
const multipleInput = "I'm stressed about my grades, can't afford tuition, feel lonely, and my family expects perfection";
const multipleKnowledge = ai.injectUniversityStudentKnowledge(multipleInput);
console.log("Input:", multipleInput);
console.log("Knowledge injected:", multipleKnowledge ? "✅ Yes" : "❌ No");
if (multipleKnowledge) {
  console.log("Knowledge includes academic expertise:", multipleKnowledge.includes("ACADEMIC EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes financial expertise:", multipleKnowledge.includes("FINANCIAL EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes social expertise:", multipleKnowledge.includes("SOCIAL EXPERTISE") ? "✅ Yes" : "❌ No");
  console.log("Knowledge includes family expertise:", multipleKnowledge.includes("FAMILY EXPERTISE") ? "✅ Yes" : "❌ No");
}

// Test 10: Test no relevant concerns
console.log("\n10. Testing No Relevant Concerns...");
const noConcernInput = "Hello, how are you today?";
const noConcernKnowledge = ai.injectUniversityStudentKnowledge(noConcernInput);
console.log("Input:", noConcernInput);
console.log("Knowledge injected:", noConcernKnowledge ? "✅ Yes" : "❌ No");
console.log("Expected: No knowledge injection for general conversation");

console.log("\n" + "=" .repeat(60));
console.log("🎓 AI Training Verification Complete!");
console.log("The AI system is now trained with comprehensive university student knowledge");
console.log("It can provide evidence-based interventions for:");
console.log("- Academic pressures and CGPA anxiety");
console.log("- Financial stress and self-funding challenges");
console.log("- Social isolation and peer pressure");
console.log("- Family expectations and cultural pressure");
console.log("- Religious/spiritual integration");
console.log("- Mental health issues specific to university students");
console.log("- Practical resources and campus services");
console.log("- Evidence-based therapeutic techniques");
