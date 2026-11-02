# dahbord_Skills

אוסף סקילים ל־Claude.

## הסקילים

| סקיל | מה הוא עושה |
|---|---|
| [`sheet-dashboard-vercel-google-login`](sheet-dashboard-vercel-google-login/SKILL.md) | בונה דשבורד מגיליון Google Sheets: התחברות עם Google (רק מי שיש לו גישה לגיליון), עריכה חזרה לגיליון, פריסה ל־GitHub ול־Vercel, הסבר להגדרת Google Cloud, והתחברות ארוכת טווח במכשיר. |

## התקנה

### באפליקציית Claude (claude.ai, דסקטופ, מובייל)

1. מורידים את הריפו: בעמוד הריפו ב־GitHub לוחצים על **Code** ואז **Download ZIP**, ומחלצים.
2. נכנסים לתיקייה `sheet-dashboard-vercel-google-login` ויוצרים ממנה קובץ ZIP חדש. בתוך ה־ZIP צריכה להיות התיקייה עצמה, ובתוכה הקובץ `SKILL.md`.
3. ב־Claude נכנסים ל־**Customize**, ואז **Skills**, לוחצים על הוספה (**+**) ובוחרים העלאת סקיל (**Upload a skill**), ומעלים את ה־ZIP.
4. מפעילים את הסקיל במתג שלידו. אם הוא מופיע באפור, צריך להפעיל אותו.

העלאת סקילים עשויה להיות מוגבלת בחלק מהתוכניות. הפרטים במרכז העזרה: [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude).

### ב־Claude Code

מעתיקים את התיקייה לתיקיית הסקילים האישית:

```bash
git clone https://github.com/geulah770/dahbord_skills.git
mkdir -p ~/.claude/skills
cp -r dahbord_skills/sheet-dashboard-vercel-google-login ~/.claude/skills/
```

לשימוש בפרויקט אחד בלבד מעתיקים ל־`.claude/skills/` בתוך הפרויקט. הסקיל נטען בהפעלה הבאה של Claude Code.

## שימוש

אחרי ההתקנה מבקשים, למשל:

> בנה לי דשבורד מהגיליון הזה, עם התחברות Google ופריסה ל־Vercel

Claude יטען את הסקיל וילך איתך שלב אחר שלב.

## מה צריך להכין מראש

- גיליון Google Sheets (או קובץ שאפשר להפוך לגיליון).
- חשבון GitHub, וריפו ריק לדשבורד.
- חשבון Vercel מחובר ל־GitHub.
- פרויקט ב־Google Cloud, שבו יוגדר OAuth Client. ההסבר המלא בתוך הסקיל.
- חיבורים (Connectors) ל־Google Drive, Google Sheets ו־Vercel ב־Claude, כדי שהוא יוכל ליצור ולפרוס בשבילך.

## עדכון

כשהסקיל מתעדכן בריפו, מורידים שוב ומעלים מחדש (או מריצים `git pull` ומעתיקים שוב ב־Claude Code).
