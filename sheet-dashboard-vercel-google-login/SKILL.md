---
name: "sheet-dashboard-vercel-google-login"
description: "בונה דשבורד HTML מגיליון Google Sheets, מוגן בהתחברות Google (רק מי שיש לו גישה לגיליון), עם עריכה חזרה לגיליון, פריסה ל־GitHub ול־Vercel או ל־Cloudflare Pages והסבר ל־Google Cloud. להשתמש גם כשמבקשים דשבורד או אתר מגיליון ומזכירים Cloudflare, Pages או pages.dev."
---

# דשבורד מגיליון Google Sheets עם התחברות Google, GitHub ו־Vercel או Cloudflare Pages

מתכון מלא ליצירת דשבורד אינטראקטיבי מגיליון. הוא נבדק על דשבורד ״שכירות תאים״ ועל דשבורד התורמים. כל הטקסטים בדף בעברית, מימין לשמאל. את ההסברים למשתמש כותבים בעברית קצרה, שלב אחרי שלב.

## מה מקבלים
- דף `index.html` יחיד, בלי שלב בנייה, שקורא וכותב לגיליון ישירות דרך Sheets API באמצעות אסימון הגישה של המשתמש המחובר.
- רק חשבון Google שיש לו גישה לגיליון יכול לראות. חשבון עם צפייה בלבד קורא אבל לא שומר. אין סיסמה ואין חשבון שירות.
- התחברות ארוכת טווח: עוגייה מוצפנת ל־60 יום שמתחדשת בכל שימוש, כך שמכשיר שהתחבר נשאר מחובר.
- ריפו ב־GitHub ופריסה ב־Vercel או ב־Cloudflare Pages שמתעדכנת בכל דחיפה.

## בחירת פלטפורמת פריסה
Vercel היא ברירת המחדל. אם המשתמש מבקש Cloudflare Pages (או מזכיר `pages.dev`), לקרוא את `references/cloudflare-pages.md` ולהחליף בו שלושה דברים: קבצי השרת של שלב 2 (גרסת Workers מוכנה ב־`assets/cloudflare/`), הפריסה של שלב 5, והכתובות של שלב 6. כל השאר זהה: הגיליון, הדף, בדיקת הדף, GitHub והתחברות ארוכת טווח. אם לא ברור מה המשתמש רוצה ויש לו חשבונות בשתיהן, לשאול שאלה אחת קצרה. שם הסקיל נשאר כמו שהוא כדי לא לשבור התקנות קיימות.

## שלב 0: להבין את הגיליון
1. למצוא את הקובץ ב־Drive. אם זה מסמך Docs ולא Sheets, ליצור גיליון חדש עם `mcp__Google_Drive__create_file` (סוג `application/vnd.google-apps.spreadsheet`) ולהעביר אליו את הנתונים. לפני יצירה או שינוי של גיליון לקרוא את ה־skill `anthropic-skills:google-workspace` ואת `references/sheets.md` שלו.
2. מבנה מומלץ: לשונית אחת בשם ברור (למשל ״תאים״), שורת כותרות, שורה לכל רשומה. עמודה אחרונה ״במקור בקובץ״ שומרת את הטקסט המקורי. עמודות בחירה (סוג, חודש, סוג רישום) עם רשימת בחירה (`setDataValidation`), `rightToLeft: true` ושורה קפואה.
3. שמות הלשוניות בעברית: אחרי יצירת גיליון חדש הלשונית נקראת ״גיליון1״ ולא Sheet1. לקרוא `get_spreadsheet` עם `fields: ["sheets.properties"]` ולהשתמש בשם המדויק.
4. כתיבת ערכים: `update_values` מפרש קלט כמו ממשק הגיליון. להעביר מספרים כמספרים. טקסט שנראה כמו מספר או תאריך מקבל גרש בתחילתו בכתיבה דרך המחבר.

## שלב 1: הדף
מבנה: כותרת, שורת מדדים שאפשר ללחוץ עליהן לסינון, חיפוש, אזור ״דורש טיפול״ (איחורים ותשלומים קרובים), הקבוצה הנצפית (לדוגמה ארונות ותאים עם צבע לפי מצב), וטבלה מלאה. חלון עריכה לכל רשומה עם כפתורים: שמירה, פעולה מהירה (למשל ״שולם החודש״), ביטול.

כללים שנלמדו:
- **להוסיף תמיד** `[hidden]{display:none!important}` ו־`body{margin:0}` בראש ה־CSS של הדף העצמאי. בלעדיהם חלון העריכה (`display:flex`) מכסה את הדף בטעינה. (בארטיפקט של claude.ai השלד מוסיף את זה לבד.)
- **מסך כניסה מפורש:** כל עוד אין נתונים, להסתיר מדדים, חיפוש ורשימות ולהציג רק כרטיס עם הכפתור ״התחברות עם Google״ (class `gated` על `body`). אחרת כפתור ההתחברות נדחק מתחת למדדים ריקים והמשתמש חושב שלא ביקשו ממנו להתחבר.
- בלי כפתור ״פתיחת הגיליון״ בכותרת. העריכה נעשית בדשבורד.
- תאריכים עבריים בעברית מחושבים בדפדפן. חודש אדר בשנה מעוברת הוא אדר א׳ ואדר ב׳. מספר חודשים לתשלום שנתי מחושב לפי שנים עבריות, לא 12 חודשים קבועים.
- צבע ומצב לא מועברים בצבע בלבד: גם טקסט (״באיחור 5 חודשים״).
- כתיבה בטוחה: לפני כתיבה לשורה לקרוא `A{row}:B{row}` ולוודא שהמפתח (למשל ארון ומספר תא) עדיין תואם. אם לא, לדחות עם הודעה. לכתוב עם `valueInputOption=RAW` כדי שלא יפורשו ערכים.
- רענון אוטומטי כל 60 שניות, ושמירה על הנתונים הישנים אם הרענון נכשל זמנית.

### קוד ההתחברות בצד הדף
```js
let gTok=null,gExp=0;
async function gToken(force){
  if(!force&&gTok&&Date.now()<gExp)return gTok;
  const r=await fetch('/api/auth/token',{headers:{'X-Requested-With':'dashboard'},cache:'no-store',credentials:'same-origin'});
  if(r.status===401)throw {code:'unauthorized'};
  if(r.status===500)throw {code:'not_configured'};
  if(!r.ok)throw {code:'upstream_error'};
  const j=await r.json();
  gTok=j.access_token;gExp=Date.now()+((j.expires_in||3600)-120)*1000;return gTok;
}
async function gFetch(path,opt,retried){
  const t=await gToken(!!retried);
  const o=Object.assign({},opt||{});
  o.headers=Object.assign({},o.headers||{},{authorization:'Bearer '+t});o.cache='no-store';
  const r=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+SHEET_ID+'/values/'+path,o);
  if(r.status===401&&!retried){gTok=null;return gFetch(path,opt,true);}
  if(r.status===401)throw {code:'unauthorized'};
  if(r.status===403||r.status===404)throw {code:'no_access'};
  if(!r.ok)throw {code:'upstream_error'};
  return r.json();
}
```
כפתור התחברות: `location.href='/api/auth/login'`. התנתקות: `POST /api/auth/logout` עם הכותרת `X-Requested-With: dashboard`. שגיאות שגוגל מחזירה מגיעות ב־`?autherror=` ויש למפות אותן להודעות בעברית (`access_denied`, `missing_scope`, `state`, `no_refresh_token`, `invalid_client`, `server`). במצב `no_access` להציע ״התחברות עם חשבון אחר״ (התנתקות ואז `/api/auth/login`). בהתחלה לקרוא `/api/config`: אם אין `clientId`, להציג ״ההתחברות עוד לא מוגדרת״.

## שלב 2: קבצי השרת (Vercel Functions, CommonJS)
(ל־Cloudflare Pages לא משתמשים בקבצים האלה. ראו `references/cloudflare-pages.md`.)
לשים ב־`api/`. ללא תלויות חיצוניות, Node 20 ומעלה.

`api/config.js`:
```js
module.exports = function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
};
```

`api/_session.js`:
```js
const crypto = require('crypto');
const SESSION = 'dd_session';
const STATE = 'dd_state';
const MAX_AGE = 60 * 24 * 3600; // 60 ימים, מתחדש בכל שימוש
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
function key() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return crypto.createHash('sha256').update(s).digest();
}
function seal(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url');
}
function open(str) {
  try {
    const b = Buffer.from(str, 'base64url');
    const d = crypto.createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
  } catch (e) { return null; }
}
function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function setCookie(res, name, value, maxAge) {
  const c = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, c) : [c]);
}
function origin(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  return `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
}
function readSession(req) { const v = cookies(req)[SESSION]; return v ? open(v) : null; }
function saveSession(res, rt) { setCookie(res, SESSION, seal({ rt }), MAX_AGE); }
function clearSession(res) { setCookie(res, SESSION, '', 0); }
function guard(req, res, method) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== method || req.headers['x-requested-with'] !== 'dashboard') {
    res.status(400).json({ error: 'bad_request' });
    return false;
  }
  return true;
}
async function googleToken(params) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      ...params,
    }),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, data: j };
}
module.exports = { SESSION, STATE, SCOPE, setCookie, cookies, origin, readSession, saveSession, clearSession, guard, googleToken };
```

`api/auth/login.js`:
```js
const crypto = require('crypto');
const { STATE, SCOPE, setCookie, origin } = require('../_session');
module.exports = function (req, res) {
  const state = crypto.randomBytes(16).toString('hex');
  setCookie(res, STATE, state, 600);
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: origin(req) + '/api/auth/callback',
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent select_account',
    state,
  }).toString();
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 302;
  res.setHeader('Location', u.toString());
  res.end();
};
```

`api/auth/callback.js`:
```js
const { STATE, SCOPE, cookies, setCookie, origin, saveSession, googleToken } = require('../_session');
function back(res, err) {
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 302;
  res.setHeader('Location', err ? '/?autherror=' + encodeURIComponent(err) : '/');
  res.end();
}
module.exports = async function (req, res) {
  const q = req.query || {};
  const want = cookies(req)[STATE];
  setCookie(res, STATE, '', 0);
  if (q.error) return back(res, q.error);
  if (!want || q.state !== want || !q.code) return back(res, 'state');
  try {
    const { ok, data } = await googleToken({ grant_type: 'authorization_code', code: q.code, redirect_uri: origin(req) + '/api/auth/callback' });
    if (!ok || !data.refresh_token) return back(res, data.error || 'no_refresh_token');
    if (String(data.scope || '').indexOf(SCOPE) < 0) return back(res, 'missing_scope');
    saveSession(res, data.refresh_token);
    return back(res);
  } catch (e) { return back(res, 'server'); }
};
```

`api/auth/token.js`:
```js
const { readSession, saveSession, clearSession, guard, googleToken } = require('../_session');
module.exports = async function (req, res) {
  if (!guard(req, res, 'GET')) return;
  let s;
  try { s = readSession(req); } catch (e) { return res.status(500).json({ error: 'server_config' }); }
  if (!s || !s.rt) return res.status(401).json({ error: 'no_session' });
  try {
    const { ok, data } = await googleToken({ grant_type: 'refresh_token', refresh_token: s.rt });
    if (!ok) {
      if (data.error === 'invalid_grant') { clearSession(res); return res.status(401).json({ error: 'expired' }); }
      return res.status(502).json({ error: 'google' });
    }
    saveSession(res, s.rt); // תוקף מתחדש בכל שימוש
    return res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in });
  } catch (e) { return res.status(502).json({ error: 'server' }); }
};
```

`api/auth/logout.js`:
```js
const { readSession, clearSession, guard } = require('../_session');
module.exports = async function (req, res) {
  if (!guard(req, res, 'POST')) return;
  try {
    const s = readSession(req);
    if (s && s.rt) {
      await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: s.rt }) }).catch(() => {});
    }
  } catch (e) {}
  clearSession(res);
  res.status(200).json({ ok: true });
};
```

קבצים נוספים בשורש: `package.json` (`{"name":"...","private":true,"engines":{"node":">=20"}}`), `vercel.json` עם כותרות `X-Robots-Tag: noindex`, `.gitignore` (`.vercel`, `node_modules`, `.env*`), ו־`README.md` בעברית עם ההגדרה.

## שלב 3: בדיקה מקומית לפני פריסה
להריץ שרת קטן ב־Node שמגיש את `index.html` ועונה על `/api/config` ו־`/api/auth/token` (401 ואז 200), ובעזרת Playwright (כבר מותקן, `require('playwright')`) ללכוד מסך במסך צר של 400 פיקסלים: (א) מסך כניסה לפני התחברות, (ב) נתונים אחרי התחברות מדומה, כשבקשות ל־`sheets.googleapis.com` מיורטות עם `page.route`, (ג) לחיצה על רשומה פותחת עריכה ושמירה סוגרת אותה. לוודא שאין `pageerror`. לבדוק תחביר של הסקריפט עם `node --check`.

## שלב 4: GitHub
- מהסביבה אי אפשר ליצור ריפו (`gh api user/repos` נחסם). לבקש מהמשתמש ליצור ב־github.com/new ריפו **ריק** בשם הדשבורד תחת `geulah770`, ולשלוח את הכתובת.
- לקרוא `mcp__claude-code-remote__add_repo` עם `access: "push"`. אם התיקייה המקומית כבר קיימת עם הקוד, **לא לשכפל**: `git remote add origin https://github.com/geulah770/<name>` ואז `git push -u origin main`. אזהרה כמו ״push negotiation failed״ על ריפו ריק לא מפריעה. לוודא עם `git ls-remote origin`, ולקרוא `register_repo_root`.
- הודעות קומיט נגמרות בשורות השיוך (Co-Authored-By ו־Claude-Session) לפי מה שנקבע בשיחה.

## שלב 5: Vercel
(ל־Cloudflare Pages: חלק ״פריסה״ ב־`references/cloudflare-pages.md`.)
צוות ברירת המחדל: `shaarei`, מזהה `team_jsDc8N1DLmAHW1u7X3IwVqPI`.
1. `create_git_project` עם `repo: geulah770/<name>`, ה־teamId ו־`provider: github`. אם הוא נכשל בשגיאת סכמה (קרה כך), **לא לנסות שוב בלי לבדוק**: ה־`get_project` ו־`list_projects` עם `repoUrl` מראים אם הפרויקט נוצר ומחובר.
2. אם אין פריסה, ליצור פריסה ראשונה עם `create_deployment`: `target: "production"`, `skipAutoDetectionConfirmation: "1"`, ובגוף `projectSettings` עם כל השדות `null` ו־`gitSource` מסוג github עם `org`, `repo`, `ref: main` ו־`sha`. אחריה כל דחיפה ל־main פורסת אוטומטית.
3. כיבוי ההגנה של Vercel (`ssoProtection`), כדי שההגנה היחידה תהיה התחברות Google: `update_project` עם `{"ssoProtection": null}`. בלי זה Vercel דורש גם כניסה לחשבון Vercel לפני שהדף נטען.
4. משתני סביבה עם `create_project_env`: `GOOGLE_CLIENT_ID` (סוג plain, כל הסביבות), ו־`SESSION_SECRET` (סוג sensitive, production ו־preview, מחרוזת אקראית ארוכה מ־`secrets.token_urlsafe(48)`). לעדכון ערך קיים להשתמש ב־`upsert: "true"`. את `GOOGLE_CLIENT_SECRET` המשתמש מדביק בעצמו ב־Vercel. לא לבקש אותו בצ'אט, לא לפענח משתנים של פרויקטים אחרים.
5. אחרי כל שינוי במשתני סביבה צריך Redeploy: `create_deployment` עם `deploymentId` של הפריסה האחרונה, `forceNew: "1"`, `withLatestCommit: true`. לבדוק עם `get_deployment` עד `READY` (בנייה לוקחת כחצי דקה).
6. כתובת הפרודקשן: `<project>.vercel.app`.

## שלב 6: Google Cloud Console (ההסבר למשתמש)
(ב־Cloudflare Pages הכתובת היא `https://<project>.pages.dev`, כפי שמופיעה בלוח הבקרה. שאר הצעדים זהים.)
חשוב: **Client אחד מחזיק לכל היותר שני סודות**. אם המשתמש לא זוכר את הסוד של Client קיים, לא למחוק סוד, כי אחד מהם בשימוש של דשבורד אחר. ליצור **Client חדש לכל דשבורד**:
1. להיכנס ל־console.cloud.google.com/auth/clients באותו פרויקט Google Cloud של הדשבורדים הקודמים (מסך ההסכמה משותף).
2. לוודא ש־Google Sheets API מופעל (APIs & Services, ואז Library).
3. Create client, סוג Web application, שם כמו שם הדשבורד.
4. Authorized JavaScript origins: `https://<project>.vercel.app`.
5. Authorized redirect URIs: `https://<project>.vercel.app/` וגם `https://<project>.vercel.app/api/auth/callback`.
6. Create. להעתיק מיד את ה־Client ID ואת ה־Client secret. הסוד מוצג במלואו רק ביצירה, ואפשר להוריד JSON.
7. את ה־Client ID לשלוח ל־Claude, שמעדכן אותו ב־Vercel. הוא מזהה ציבורי. את ה־Client secret המשתמש מדביק ב־Vercel בשם `GOOGLE_CLIENT_SECRET` (Sensitive), ואז Redeploy (או ש־Claude מריץ אותו).
8. שינויים בגוגל יכולים לקחת כמה דקות עד שהם נכנסים לתוקף.

## התחברות ארוכת טווח (לפחות 30 יום)
- העוגייה ל־60 יום עם חידוש בכל שימוש, ואסימון הרענון נשמר רק בעוגייה מוצפנת HttpOnly. הדפדפן מקבל רק אסימון גישה קצר (שעה).
- **חובה:** במסך Audience של פרויקט Google Cloud לעבור ל־**In production**. במצב Testing גוגל מבטלת את אסימון הרענון אחרי 7 ימים ורק חשבונות מרשימת Test users יכולים להתחבר. זה הגורם היחיד לניתוק מוקדם. כשהאפליקציה בפרודקשן וההרשאה היא רק Sheets, גוגל עשויה להציג מסך ״אפליקציה לא מאומתת״, ואפשר ללחוץ ״מתקדם״ ואז להמשיך. הוא לא מבטל את תוקף ההתחברות.
- אסימון שפג (`invalid_grant`) מוחק את העוגייה, והדף חוזר למסך הכניסה.
- התנתקות מבטלת את האסימון בגוגל ומוחקת את העוגייה.

## אפשרות נוספת: גרסת ארטיפקט ב־claude.ai
אפשר לפרסם גם עמוד ארטיפקט עם `capabilities: {"mcp": {"servers": [{"server": "Google Sheets", "tools": ["get_values", "update_values"]}]}}`, שקורא וכותב דרך המחבר של Google Sheets בלי התחברות נפרדת. לזהות מצב עם `window.claude.use`. בפרסום חוזר של ארטיפקט לא לשכוח לכלול את ה־capabilities הקיימות, אחרת הפרסום נדחה.

## בדיקה סופית ודיווח
1. הגיליון: לקרוא חזרה עם `get_values` ולוודא שהנתונים תואמים למקור.
2. פריסה במצב READY, והאלייסים ל־`<project>.vercel.app`.
3. המשתמש מתחבר פעם אחת בעצמו (אי אפשר לעשות זאת בשמו). אם גוגל מציגה שגיאה (`redirect_uri_mismatch`, `access_denied`), לבקש צילום מסך. להסביר שרענון בכוח עשוי להידרש אחרי פריסה חדשה.
4. לסכם בקצרה: כתובת, מה נשאר על המשתמש, ומה לא נבדק. לא להדביק סודות בצ'אט.