// Test specific suicidal detection patterns
const ai = require('./backend/controllers/ai.js');

console.log("🚨 Testing Suicidal Detection Patterns\n");
console.log("=" .repeat(50));

const suicidalTestCases = [
  "I'm suicidal",
  "I am suicidal", 
  "I feel suicidal",
  "I'm feeling suicidal",
  "I have suicidal thoughts",
  "I'm having suicidal thoughts",
  "I feel like killing myself",
  "I feel like ending it all",
  "I want to kill myself",
  "I want to commit suicide",
  "I want to end my life",
  "I'm going to kill myself",
  "I plan to commit suicide",
  "I have thoughts of suicide",
  "I have thoughts of killing myself",
  "I'm thinking about suicide",
  "I'm thinking about killing myself",
  "I want to die",
  "I wish I was dead",
  "I need to die",
  "I desire to end it all",
  "I want to stop existing",
  "I want to end my suffering",
  "I can't take this anymore",
  "I can't cope anymore",
  "I'm at rock bottom",
  "I want to give up",
  "I'm giving up on life",
  "I want to hurt myself",
  "I want to cut myself",
  "I want to harm myself",
  "I want to punish myself",
  "I want to harm someone",
  "I want to attack my boss",
  "I want to hurt my partner"
];

console.log("Testing Crisis Detection for Suicidal Statements:\n");

let crisisDetected = 0;
let totalTests = suicidalTestCases.length;

suicidalTestCases.forEach((testCase, index) => {
  const result = ai.isSeverelyUnstable(testCase);
  const status = result ? "🚨 CRISIS" : "❌ MISSED";
  
  if (result) {
    crisisDetected++;
  }
  
  console.log(`${index + 1}. ${status} "${testCase}"`);
});

console.log("\n" + "=" .repeat(50));
console.log("📊 RESULTS:");
console.log(`✅ Crisis Detected: ${crisisDetected}/${totalTests} (${Math.round(crisisDetected/totalTests*100)}%)`);
console.log(`❌ Missed: ${totalTests - crisisDetected}/${totalTests}`);

if (crisisDetected === totalTests) {
  console.log("\n🎉 PERFECT! All suicidal statements are being detected!");
} else {
  console.log("\n⚠️  Some suicidal statements are not being detected!");
}

console.log("\n🛡️ CRISIS RESPONSE SYSTEM:");
console.log("When crisis is detected, the system will:");
console.log("1. 🚨 Immediately return danger: true");
console.log("2. 📞 Automatically book emergency therapist session");
console.log("3. 📧 Send immediate email notification to therapist");
console.log("4. 🔄 Redirect user to therapist chat interface");
console.log("5. 💬 Provide crisis resources and immediate support");
