# פריסה ל־Cloudflare Pages

לקרוא את הקובץ הזה כשהמשתמש רוצה לפרוס את הדשבורד ב־Cloudflare Pages, במקום Vercel או בנוסף אליה. הדף (`index.html`), הגיליון, ההתחברות עם Google וההסבר ל־Google Cloud זהים. מה שמשתנה: קבצי השרת, מבנה התיקיות, שלב הפריסה והכתובת.

## למה קבצי השרת שונים
Pages Functions רצות על Workers runtime ולא על Node, ואין שם `crypto.createCipheriv` או `req.query`. לכן הגרסה ב־`assets/cloudflare/` מצפינה עם Web Crypto (AES-GCM) וקוראת משתנים מ־`context.env`. הנתיבים נשארו אותם נתיבים (`/api/config`, `/api/auth/login`, `callback`, `token`, `logout`) וגם פרוטוקול התגובות זהה, ולכן הקוד בצד הדף לא משתנה בכלל.

שני הבדלים בהתנהגות לעומת גרסת Vercel: (א) עוגיות שנוצרו בגרסה אחת לא נפתחות בגרסה השנייה, וזה לא משנה כי כל פריסה היא בדומיין אחר. (ב) כש־`SESSION_SECRET` חסר, `/api/auth/token` מחזיר 500 והדף מציג ״ההתחברות עוד לא מוגדרת״, ולא 401 שנראה כמו התנתקות.

## מבנה הריפו
```
public/index.html     הדף. זו תיקיית הפלט הסטטית
public/_headers       noindex (מועתק מ־assets/cloudflare/public)
functions/api/...     הנתיבים (מועתקים מ־assets/cloudflare/functions)
lib/session.js        עזרים משותפים (מועתק מ־assets/cloudflare/lib)
wrangler.toml         אופציונלי (מועתק מ־assets/cloudflare)
package.json, .gitignore, README.md
```
`functions/` חייב להיות בשורש הפרויקט ולא בתוך תיקיית הפלט. את העזרים שמים ב־`lib/` מחוץ ל־`functions/`, כדי שלא ייווצר מהם נתיב. הפקודה: `cp -r <skill>/assets/cloudflare/* <repo>/` ואז להזיז את `index.html` ל־`public/`. ב־`.gitignore` להוסיף `.dev.vars*` ו־`.wrangler`. אם הריפו משרת גם Vercel, עדיף ריפו נפרד לכל פלטפורמה, כי המבנים שונים ולא נבדק כאן ששניהם עובדים באותו ריפו.

`wrangler.toml` אופציונלי. כשהוא קיים הוא הופך למקור האמת של השדות שמוגדרים בו (לפי התיעוד של Cloudflare), ולכן משאירים בו רק `name`, `pages_build_output_dir` ו־`compatibility_date`, ולא משתנים או סודות. את שם הפרויקט שבו להחליף בשם הדשבורד.

## בדיקה לפני פריסה
להריץ `node scripts/test-cloudflare-functions.mjs <תיקיית הפרויקט>` (Node 20 ומעלה). הסקריפט טוען את הקבצים כמו ש־Cloudflare תטען אותם, מדמה את גוגל, ובודק התחברות, חידוש, ניתוק, שגיאות, עוגייה מקולקלת וסוד חסר. בנוסף, כמו בשלב 3 הראשי, לבדוק את הדף עם Playwright. בדיקה מקומית עם Cloudflare עצמה: `npx wrangler pages dev public`, כשהמשתנים בקובץ `.dev.vars` (לא עולה ל־Git).

## פריסה
אי אפשר ליצור פרויקט Pages מהסביבה הזאת: אין כלי Pages מחובר, והרשת מהמעטפת מוגבלת. לכן המשתמש עושה את החיבור פעם אחת בלוח הבקרה, ומכאן כל דחיפה ל־`main` פורסת אוטומטית.

1. אחרי שלב 4 (הקוד כבר ב־GitHub): בלוח של Cloudflare, Workers & Pages, Create application, Pages, Connect to Git, לבחור GitHub ואת הריפו (אם צריך, Install & Authorize).
2. שם הפרויקט קובע את הכתובת `<project>.pages.dev`. ענף הפרודקשן: `main`.
3. Build settings: Framework preset ריק (None), Build command ריק, Build output directory: `public`.
4. להוסיף משתני סביבה (Settings, Variables and Secrets) **לפני** הפריסה הראשונה:
   - `GOOGLE_CLIENT_ID`: טקסט רגיל. מזהה ציבורי.
   - `GOOGLE_CLIENT_SECRET`: סוד (Encrypt). המשתמש מדביק בעצמו. לא מבקשים אותו בצ'אט.
   - `SESSION_SECRET`: סוד (Encrypt), מחרוזת אקראית ארוכה. המשתמש מייצר אותה אצלו (למשל `openssl rand -base64 48`) ולא מדביקים אותה בצ'אט.
5. Save and Deploy. אחרי שינוי משתנים כדאי להריץ פריסה חוזרת (Retry deployment או דחיפה ריקה), כדי שהקוד יקבל את הערכים החדשים. לא אימתנו בתיעוד אם שינוי משתנים חל בלי פריסה חדשה.
6. כתובת הפרודקשן: להעתיק מלוח הבקרה את הכתובת המדויקת, ולא להניח שהיא `<שם-הריפו>.pages.dev`.

חלופה: פריסה משורת הפקודה אצל המשתמש עם `npx wrangler pages deploy public --project-name <name>` ו־`CLOUDFLARE_API_TOKEN`. לא נבדקה כאן. שימו לב: העלאה ידנית של תיקייה בלוח הבקרה (Direct Upload) לא תומכת ב־Functions, ולכן לא מתאימה לדשבורד הזה.

ל־Cloudflare יש גם חיבור (Connector) במרשם של Claude, אבל הכלים שלו מכסים Workers, KV, D1 ו־R2 ולא Pages. אם הוא מחובר ויש בו כלי Pages, אפשר להשתמש בו. אחרת לעבוד כמתואר למעלה.

## Google Cloud Console
אותם צעדים כמו בשלב 6 הראשי, עם הכתובת של Pages במקום Vercel:
- Authorized JavaScript origins: `https://<project>.pages.dev`
- Authorized redirect URIs: `https://<project>.pages.dev/` וגם `https://<project>.pages.dev/api/auth/callback`

פריסות Preview של Pages יושבות בכתובות אחרות, שלא רשומות ב־Google Cloud, ולכן ההתחברות לא תעבוד בהן. לבדוק רק בכתובת הפרודקשן. אם יש `APP_URL` כמשתנה סביבה, הוא קובע את ה־redirect_uri במקום הכתובת של הבקשה.

## בדיקה סופית
כמו בסעיף הסופי הראשי: הנתונים בגיליון, הפריסה האחרונה הצליחה בלוח Workers & Pages, והמשתמש מתחבר פעם אחת בעצמו. שגיאות מגוגל (`redirect_uri_mismatch`, `access_denied`) כמו ב־Vercel. אם נראה שהדף ישן אחרי פריסה, רענון בכוח.
