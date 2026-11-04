/**
 * Машины өдөр тутмын үзлэг: Google Sheet-д өгөгдөл хүлээн авах Apps Script.
 *
 * Суулгах:
 * 1. Google Drive дээр шинэ Google Sheet үүсгэнэ (жишээ нь "Машины үзлэг").
 * 2. Sheet-ээ нээгээд Extensions > Apps Script.
 * 3. Code.gs доторх бүгдийг устгаад энэ файлыг бүтнээр нь хуулж тавина. Save.
 * 4. Deploy > New deployment > Type: Web app.
 *    Execute as: Me. Who has access: Anyone. Deploy.
 * 5. Google зөвшөөрөл асууна: Authorize > (Advanced > Go to ... ) > Allow.
 * 6. Гарсан /exec холбоосыг аппын Тохиргоо хэсэгт тавина (эсвэл Claude-д илгээвэл
 *    аппын кодонд суулгаж өгнө, тэгвэл жолооч бүр тохируулах шаардлагагүй).
 *
 * Шинэчлэх: кодоо солиод Save > Deploy > Manage deployments > ✏️ Edit >
 * Version: New version > Deploy. /exec холбоос хэвээр үлдэнэ.
 *
 * Үзлэг бүр судалгааны нэртэй хуудсанд (жишээ нь "Хулан хүзүүвчлэх 2026") мөр болж орно.
 * Селфи ба гэмтлийн зураг Drive-ийн "Машины үзлэг зураг / <судалгаа>" хавтсанд хадгалагдана.
 */

var PHOTO_ROOT = 'Машины үзлэг зураг';
// Хүлээн авах имэйл. Олон хаяг бол таслалаар: 'a@gmail.com,b@gmail.com'
var RECIPIENTS = 'data.brcc@gmail.com';
// false: зөвхөн хэвийн бус зүйлтэй үзлэгийг имэйлээр мэдэгдэнэ. true: бүх үзлэгийг.
var EMAIL_ALL = false;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var req = JSON.parse(e.postData.contents);
    var out;
    if (req.action === 'ping') out = { ok: true, sheet: SpreadsheetApp.getActive().getName() };
    else if (req.action === 'upsert') out = upsert(req);
    else if (req.action === 'photo') out = photo(req);
    else if (req.action === 'notify') out = notify(req);
    else out = { ok: false, error: 'unknown action' };
    return json(out);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json({ ok: true, app: 'Машины үзлэг' });
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Мөрүүдийг id-аар нь шинэчилнэ, байхгүй бол нэмнэ.
function upsert(req) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(req.sheet) || ss.insertSheet(req.sheet);
  var headers = req.headers;
  var lastCol = sh.getLastColumn();
  var cur = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
  if (!cur.filter(String).length) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    cur = headers.slice();
  } else {
    headers.forEach(function (h) {
      if (cur.indexOf(h) < 0) { cur.push(h); sh.getRange(1, cur.length).setValue(h).setFontWeight('bold'); }
    });
  }
  var keyCol = cur.indexOf(req.key);
  var lastRow = sh.getLastRow();
  var ids = lastRow > 1 ? sh.getRange(2, keyCol + 1, lastRow - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  var appended = [];
  req.rows.forEach(function (row) {
    var vals = cur.map(function (h) { return row[h] === undefined || row[h] === null ? '' : row[h]; });
    var i = ids.indexOf(String(row[req.key]));
    if (i >= 0) sh.getRange(i + 2, 1, 1, vals.length).setValues([vals]);
    else { appended.push(vals); ids.push(String(row[req.key])); }
  });
  if (appended.length) {
    var start = sh.getLastRow() + 1;
    // Огноо, цаг, гүйлтийг текстээр хадгална (Sheet өөрөө хөрвүүлэхгүй)
    sh.getRange(start, 1, appended.length, cur.length).setNumberFormat('@').setValues(appended);
  }
  return { ok: true, updated: req.rows.length - appended.length, added: appended.length };
}

function folder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// Зургийг Drive-д хадгалж холбоосыг буцаана. Ижил нэртэй байвал дахин үүсгэхгүй.
function photo(req) {
  var dir = folder(folder(DriveApp.getRootFolder(), PHOTO_ROOT), req.folder || 'Бусад');
  var ex = dir.getFilesByName(req.name);
  var file = ex.hasNext() ? ex.next() : dir.createFile(Utilities.newBlob(Utilities.base64Decode(req.data), req.mime || 'image/jpeg', req.name));
  if (req.caption) file.setDescription(req.caption);
  RECIPIENTS.split(',').forEach(function (r) { try { file.addViewer(r.trim()); } catch (e) {} });
  return { ok: true, url: file.getUrl() };
}

// Хэвийн бус зүйлтэй үзлэгийг (эсвэл EMAIL_ALL бол бүгдийг) имэйлээр мэдэгдэнэ.
function notify(req) {
  if (!EMAIL_ALL && !req.bad) return { ok: true, skipped: true };
  var body = (req.body || '') + '\n\nSheet: ' + SpreadsheetApp.getActive().getUrl();
  MailApp.sendEmail(RECIPIENTS, req.subject || 'Машины үзлэг', body, { name: 'Машины үзлэг · BRCC' });
  return { ok: true, to: RECIPIENTS };
}
