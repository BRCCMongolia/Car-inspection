# Машины өдөр тутмын үзлэг

БНХТ (BRCC) · Биологийн Нөөцийг Хамгаалах Төв. Жолооч өглөө бүр машинаа шалгаж, селфи авч илгээдэг утасны апп.

**Апп:** https://brccmongolia.github.io/Car-inspection/

## Утсандаа суулгах
- **iPhone:** Safari-гаар дээрх холбоосыг нээгээд **Share ⬆ → Add to Home Screen**.
- **Android:** Chrome-оор нээгээд **⋮ → Install app**.

Суулгасны дараа нүүр дэлгэцийн айконоос нээнэ. Интернэтгүй үед ч ажиллана, үзлэгүүд интернэт орохоор Sheet рүү автоматаар илгээгдэнэ.

## Google Sheet ба имэйл холбох (нэг удаа)
1. Google Drive дээр шинэ Google Sheet үүсгэнэ.
2. **Extensions → Apps Script**, `apps-script/Code.gs`-ийн агуулгыг бүтнээр нь хуулж тавиад Save.
3. **Deploy → New deployment → Web app**, *Execute as: Me*, *Who has access: Anyone* → Deploy → Authorize.
4. Гарсан `/exec` холбоосыг аппын **Тохиргоо** хэсэгт тавина. Бүх утсанд нэг дор тохируулах бол `index.html` доторх `DEFAULT_SHEET_URL`-д бичнэ.

- Үзлэг бүр судалгааны нэртэй хуудсанд нэг мөр болно.
- Селфи, гэмтлийн зураг Drive-ийн **Машины үзлэг зураг** хавтсанд хадгалагдана.
- Хэвийн бус зүйлтэй үзлэгийг `data.brcc@gmail.com` руу имэйлээр мэдэгдэнэ (`Code.gs` доторх `RECIPIENTS`, `EMAIL_ALL`).

## Файлууд
- `index.html`: апп (нэг файл).
- `manifest.webmanifest`, `sw.js`: суулгах ба офлайн ажиллагаа. Апп шинэчлэхдээ `sw.js` доторх `VERSION`-ийг өөрчилнө.
- `img/`: айкон, BRCC лого.
- `apps-script/Code.gs`: Google Sheet, Drive, имэйл.
