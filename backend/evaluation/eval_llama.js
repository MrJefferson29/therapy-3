/*
  Evaluation for custom Llama model (intents + empathy)
  - Reads labeled JSONL files
  - Calls Llama2AI directly (bypassing model selection)
  - Forces JSON outputs for scoring
  - Reports accuracy and macro-F1

  Usage:
    node backend/evaluation/eval_llama.js \
      --intents evaluation/intents.jsonl \
      --empathy evaluation/empathy.jsonl

  Env:
    HUGGINGFACE_API_KEY=<token>
    LLAMA2_MODEL_URL=meta-llama/Llama-2-7b-chat-hf  (or your LoRA path)
*/

const fs = require('fs');
const path = require('path');
const Llama2AI = require('../services/llama2AI');

function readJSONL(filePath) {
  return fs
    .readFileSync(filePath, 'utf-8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function macroF1(yTrue, yPred) {
  const labels = Array.from(new Set(yTrue));
  let sum = 0;
  for (const c of labels) {
    let tp = 0, fp = 0, fn = 0;
    for (let i = 0; i < yTrue.length; i++) {
      const yt = yTrue[i], yp = yPred[i];
      if (yp === c && yt === c) tp++;
      else if (yp === c && yt !== c) fp++;
      else if (yp !== c && yt === c) fn++;
    }
    const prec = tp + fp === 0 ? 0 : tp / (tp + fp);
    const rec = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = prec + rec === 0 ? 0 : (2 * prec * rec) / (prec + rec);
    sum += f1;
  }
  return labels.length ? sum / labels.length : 0;
}

function accuracy(yTrue, yPred) {
  if (!yTrue.length) return 0;
  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) if (yTrue[i] === yPred[i]) correct++;
  return correct / yTrue.length;
}

function parseJsonLineFromOutput(text) {
  const match = text.match(/JSON:\s*(\{[\s\S]*\})/i);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch { return {}; }
}

function buildEvalPrompt(userText, intents) {
  const labelList = intents.join(', ');
  return `${userText}\n\nRespond briefly. Then output on a new line exactly:\nJSON: { "intent": <one_of:[${labelList}]>, "empathy": <one_of:[low, medium, high]> }`;
}

async function evaluateSplit(llama, filePath, labelKey, intents) {
  const data = readJSONL(filePath);
  const yTrue = [];
  const yPred = [];

  for (const ex of data) {
    const prompt = buildEvalPrompt(ex.text, intents);
    const result = await llama.generateContent(prompt);
    const outText = await result.response.text();
    const parsed = parseJsonLineFromOutput(outText);
    const pred = String((parsed[labelKey] || '')).trim().toLowerCase();
    const gold = String((ex[labelKey] || '')).trim().toLowerCase();
    yTrue.push(gold);
    yPred.push(pred);
  }

  return {
    accuracy: Number(accuracy(yTrue, yPred).toFixed(4)),
    f1_macro: Number(macroF1(yTrue, yPred).toFixed(4)),
    support: Object.fromEntries(
      Array.from(new Set(yTrue)).map((c) => [c, yTrue.filter((x) => x === c).length])
    )
  };
}

async function main() {
  const args = process.argv.slice(2);
  const getFlag = (name) => (args.find((a) => a === name) && args[args.indexOf(name) + 1]) || '';
  const intentsPath = getFlag('--intents');
  const empathyPath = getFlag('--empathy');
  const cliKey = getFlag('--hf_key');
  const cliModel = getFlag('--model');

  const apiKey = cliKey || process.env.HUGGINGFACE_API_KEY;
  const modelUrl = cliModel || process.env.LLAMA2_MODEL_URL || 'meta-llama/Llama-2-7b-chat-hf';

  if (!apiKey) {
    console.error('Missing Hugging Face API key. Provide via --hf_key or HUGGINGFACE_API_KEY env var.');
    process.exit(1);
  }

  const llama = new Llama2AI(apiKey, modelUrl);

  // Define your intent label set here to constrain outputs
  const intentLabels = [
    'book_appointment',
    'gratitude',
    'general_question',
    'crisis',
    'check_status'
  ];

  if (intentsPath && fs.existsSync(intentsPath)) {
    console.log('Evaluating INTENTS on Llama ->', intentsPath);
    const res = await evaluateSplit(llama, intentsPath, 'intent', intentLabels);
    console.log('INTENTS metrics:', res);
  } else {
    console.log('Skip intents: file not provided.');
  }

  if (empathyPath && fs.existsSync(empathyPath)) {
    console.log('Evaluating EMPATHY on Llama ->', empathyPath);
    const res = await evaluateSplit(llama, empathyPath, 'empathy', intentLabels);
    console.log('EMPATHY metrics:', res);
  } else {
    console.log('Skip empathy: file not provided.');
  }
}

main().catch((e) => {
  console.error('Evaluation failed:', e.message || e);
  process.exit(1);
});


