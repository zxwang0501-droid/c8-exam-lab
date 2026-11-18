# Data C8 Exam Lab

An unofficial, bilingual (English questions, Chinese explanations) practice tool for UC Berkeley Data C8 / Data 8, Foundations of Data Science.

- Pick one or more topics, then generate an exam-style set: multiple choice, select-all, true/false, short answer, and Table-code fill-in questions.
- Add case studies (大题): about 20 points each, with a background story, a data table, and parts (a), (b), (c) that combine several topics, like the long questions on finals. A one-click mock exam mixes 15 single questions with 3 case studies.
- Every question comes with an answer and an explanation. Short answers include grading key points.
- A searchable concept list covers 23 topics in the course's lecture order.
- A mistake book keeps track of missed questions, saved in your own browser.

All questions are original practice questions written in the style of the public 2021–2026 exams. This project is not affiliated with UC Berkeley or the course staff.

## Use

Open `index.html` in any browser, or visit the GitHub Pages site.

## Edit

The sources are in `src/`. The question bank is in `bank-*.js`, the case studies in `cases-*.js`, the randomized templates in `gen.js`, and the concepts in `kb.js`. After editing, run `./build.sh` to regenerate `index.html`.
