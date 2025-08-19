# 📚 Language Learning Question Archives

## Overview

Instead of generating questions with AI (which costs money), you can import **hundreds of thousands** of existing questions from free archives. This guide shows you how to use the top 5 archives for your language learning app.

## 🏆 Archive Sources

### 1. **OpenQuizzDB** - 279,135+ General Knowledge Questions
- **Languages**: French, Spanish, English, German, Italian, Portuguese
- **Format**: Multiple choice questions with explanations
- **Perfect for**: General knowledge sections, cultural learning
- **License**: Creative Commons CC BY-SA
- **Download**: `git clone https://github.com/Zeuh/OpenQuizzDB.git`

### 2. **Tatoeba Project** - 700,000+ Sentence Translations
- **Languages**: 70+ languages (Spanish, French, German, etc.)
- **Format**: Bilingual sentence pairs
- **Perfect for**: Translation exercises, context learning
- **License**: CC BY 2.0
- **Download**: https://www.manythings.org/anki/

### 3. **CodingFriends Vocabulary** - Essential Word Lists
- **Languages**: English, French, German, Spanish, Finnish, Slovak, Japanese, Korean
- **Format**: CSV word lists (200+ words per language)
- **Categories**: Food, colors, numbers, directions, weather, etc.
- **Perfect for**: Beginner vocabulary
- **Download**: `git clone https://github.com/CodingFriends/basic-vocabulary-word-lists.git`

### 4. **LinguaLibre** - Audio Pronunciation Datasets
- **Languages**: 100+ languages with native recordings
- **Format**: Audio files + text
- **Perfect for**: Pronunciation exercises
- **Download**: https://lingualibre.org/datasets/

### 5. **bionicles/languages** - Massive Wordlists
- **Languages**: 39 languages including Korean, Hindi, Bengali, Swahili
- **Format**: JSON with words and characters
- **Size**: 100MB+ vocabulary data
- **Download**: `git clone https://github.com/bionicles/languages.git`

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install csv-parser
```

### Step 2: Download Archives
```bash
# Get multiple choice questions
git clone https://github.com/Zeuh/OpenQuizzDB.git archives/openquizz

# Get sentence translations
mkdir archives/tatoeba
cd archives/tatoeba
wget https://www.manythings.org/anki/spa-eng.zip  # Spanish-English
wget https://www.manythings.org/anki/fra-eng.zip  # French-English  
wget https://www.manythings.org/anki/deu-eng.zip  # German-English
unzip '*.zip'

# Get vocabulary lists
git clone https://github.com/CodingFriends/basic-vocabulary-word-lists.git archives/vocabulary
```

### Step 3: Import Questions
```bash
# Import OpenQuizzDB (multiple choice)
npm run import-archives openquizz ./archives/openquizz/data/fr_data.json French

# Import Tatoeba (translations)
npm run import-archives tatoeba ./archives/tatoeba/spa-eng.txt Spanish English

# Import vocabulary (fill-in-blank)
npm run import-archives vocabulary ./archives/vocabulary/wordlists/en-es/basic-words.csv English Spanish
```

## 📊 Expected Results

After importing from all sources:

### Spanish
- **OpenQuizzDB**: ~15,000 multiple choice questions
- **Tatoeba**: ~142,000 translation exercises  
- **Vocabulary**: ~200 fill-in-blank questions
- **Total**: ~157,200 questions

### French  
- **OpenQuizzDB**: ~20,000 multiple choice questions
- **Tatoeba**: ~237,000 translation exercises
- **Vocabulary**: ~200 fill-in-blank questions  
- **Total**: ~257,200 questions

### German
- **OpenQuizzDB**: ~10,000 multiple choice questions
- **Tatoeba**: ~320,000 translation exercises
- **Vocabulary**: ~200 fill-in-blank questions
- **Total**: ~330,200 questions

## 🎯 Question Types Generated

### Multiple Choice (from OpenQuizzDB)
```javascript
{
  concept: "general_knowledge_history",
  question_type: "multiple_choice", 
  question_text: "In which year did World War II end?",
  options: [
    {id: "a", text: "1944", isCorrect: false, explanation: "War continued into 1945"},
    {id: "b", text: "1945", isCorrect: true, explanation: "WWII ended in 1945"},
    {id: "c", text: "1946", isCorrect: false, explanation: "War was already over"},
    {id: "d", text: "1943", isCorrect: false, explanation: "War was still ongoing"}
  ]
}
```

### Translation (from Tatoeba)
```javascript
{
  concept: "translation_practice",
  question_type: "translation",
  question_text: "Translate: 'This work isn't easy.'",
  correct_answer: "Este trabajo no es fácil.",
  source: "Tatoeba"
}
```

### Fill-in-Blank (from Vocabulary)
```javascript
{
  concept: "vocabulary_food",
  question_type: "fill_in_blank", 
  question_text: "What is 'water' in Spanish?",
  correct_answer: "agua",
  hints: "Common drink"
}
```

## 🔄 Import Commands Reference

```bash
# OpenQuizzDB (Multiple Choice)
npm run import-archives openquizz <jsonFile> <language>

# Tatoeba (Translations) 
npm run import-archives tatoeba <textFile> <sourceLang> <targetLang>

# Vocabulary (Fill-in-blank)
npm run import-archives vocabulary <csvFile> <sourceLang> <targetLang>
```

## 📈 Scaling to 100+ Languages

### Priority Import Order:
1. **Start with top 10 languages** (Spanish, French, German, Italian, Portuguese, etc.)
2. **Add vocabulary for remaining languages** using bionicles/languages wordlists
3. **Use AI generation only for gaps** in coverage

### Estimated Coverage:
- **Full coverage**: 20+ languages (OpenQuizzDB + Tatoeba + Vocabulary)
- **Vocabulary only**: 100+ languages (bionicles/languages + CodingFriends)
- **Total questions**: 2-3 million across all languages

## 💡 Pro Tips

### Performance
- **Import in batches** (100 questions at a time) to avoid database timeouts
- **Run imports during off-hours** to avoid affecting app performance
- **Index your database** on language, concept, and difficulty

### Quality Control
- **Tatoeba has the highest quality** (verified by native speakers)
- **OpenQuizzDB is professionally curated** for apps and TV shows
- **Vocabulary lists are basic but error-free**

### Cost Savings
- **Archives cost**: $0 (all free with attribution)
- **AI generation cost**: $500-2000 for equivalent content
- **Maintenance**: Archives are regularly updated by communities

## 🎉 Next Steps

1. **Test with one language first** (e.g., Spanish)
2. **Verify question quality** in your app
3. **Scale to more languages** as needed
4. **Mix with AI-generated content** for specific concepts

This approach gives you **professional-quality questions at zero cost** while supporting the open-source language learning community! 🌍