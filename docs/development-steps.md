# Ke hoach phat trien theo de cuong

Tai lieu nay chuyen hoa noi dung de cuong thanh cac buoc trien khai ky thuat de doi dev co the lam theo sprint.

## 1) Muc tieu he thong

- So hoa toan bo hop dong va quan ly tap trung.
- Tim kiem/loc nhanh theo thong tin nghiep vu.
- Theo doi thoi han chinh xac, tu dong nhac gia han.
- Giam rui ro bo sot hop dong quan trong.

## 2) Tac nhan

- `Admin`: quan ly user, toan quyen he thong.
- `Staff`: them/sua/xem hop dong, theo doi thong tin.

## 3) Chuc nang chinh

- Quan ly hop dong: CRUD + upload file.
- Quan ly thong tin: ngay ky, ngay hieu luc, ngay het han, doi tac, gia tri.
- Tim kiem va loc: ten, doi tac, trang thai.
- Nhac moc gia han: canh bao truoc han (7, 15, 30 ngay).
- Quan ly user va phan quyen.
- Thong ke bao cao: sap het han, da het han, can xu ly gap.

## 4) Quy trinh nghiep vu

1. Nguoi dung nhap thong tin va upload file hop dong.
2. He thong luu vao CSDL.
3. He thong chay job hang ngay de doi chieu thoi han.
4. Den moc canh bao thi gui thong bao/email.
5. Nguoi dung cap nhat gia han hoac ket thuc hop dong.

## 5) Buoc trien khai theo sprint

### Sprint A - On dinh va dung chuan du lieu

- Chuan hoa input/validator cho bo loc tim kiem (tranh Validation failed).
- Chuan hoa model hop dong, user, lich su thao tac.
- Hoan thien API contract cho CRUD + upload + search/filter.

### Sprint B - Nhac han tu dong 7/15/30

- Mo rong logic reminder theo 3 moc 7, 15, 30 ngay.
- Dung worker + queue de xu ly job nhac han hang ngay.
- Ghi nhan log da gui/that bai/dead-letter de retry.

### Sprint C - Quan tri va bao cao

- Hoan thien dashboard tong hop (active/expiring/expired/pending).
- Bao cao danh sach hop dong can xu ly gap.
- Export CSV cho bao cao lon theo async job.

### Sprint D - Bao mat, van hanh, chat luong

- CSRF + rate limit + hardening cron.
- Health/readiness endpoint + worker daemon.
- Day du test: unit + e2e smoke luong chinh.

## 6) Dau vao/ra cua he thong

- Dau vao: thong tin hop dong, file hop dong, tai khoan user, moc canh bao.
- Dau ra: danh sach hop dong, ket qua tim kiem/loc, thong bao nhac han, bao cao thong ke.

## 7) Tieu chi hoan thanh

- User thao tac CRUD + upload khong loi.
- Tim kiem/loc tra ket qua dung va nhanh.
- Nhac han 7/15/30 gui dung doi tuong, dung thoi diem.
- Dashboard va bao cao phan anh dung du lieu thuc te.
- CI pass: lint, typecheck, unit test, e2e smoke.
