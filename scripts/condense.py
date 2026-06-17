# -*- coding: utf-8 -*-
"""Aggressively condense the full ECMS report (target ~90-110 pages).

- Keep 8 core diagrams; drop auxiliary sequence diagrams, group-relationship
  diagrams, redundant normalization diagram, duplicate ERD, and all Chapter-4
  per-screen flow diagrams.
- Chapter 4: keep only 'Mục đích' + 'Chức năng' for each screen.
- Drop redundant per-table subsections 3.4.x / 3.5.x (covered by 2.5).
- Trim long prose / list items to the first 2 sentences.
"""
import re

BASE = r"d:\Hutech\Đồ Án\Hệ thống quản lý hợp đồng điện tử và nhắc mốc gia hạn"
SRC = BASE + r"\BAO_CAO_DO_AN_ECMS_FULL.md"
OUT = BASE + r"\BAO_CAO_DO_AN_ECMS.md"

CH4_DROP = ('Thành phần giao diện', 'Luồng hoạt động', 'Xử lý')
FORCE_DROP = (r'^2\.6\.3\b', r'^2\.7\.[4-7]\b', r'^3\.3\.3\b', r'^1\.5\.[789]\b')
TABLE_DROP = (r'^3\.2\.',)   # drop illustrative normal-form example tables
DIAGRAM_DROP_PREFIX = ()
MAX_SENTENCES = 2
TRIM_IF_LONGER = 80


def hlevel(s):
    m = re.match(r'^(#{1,6})\s', s)
    return len(m.group(1)) if m else 0


def trim_text(text, max_s=MAX_SENTENCES, thresh=TRIM_IF_LONGER):
    if len(text) <= thresh:
        return text
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return ' '.join(parts[:max_s]) if len(parts) > max_s else text


def trim_line(line, chapter=0):
    # conclusion chapter: trim harder (one sentence)
    max_s, thresh = (1, 55) if chapter == 5 else (MAX_SENTENCES, TRIM_IF_LONGER)
    s = line.strip()
    m = re.match(r'^([*\-+]\s+)(.*)$', line)
    if m:
        return m.group(1) + trim_text(m.group(2), max_s, thresh)
    m = re.match(r'^(\s*\d+[.)]\s+)(.*)$', line)
    if m:
        return m.group(1) + trim_text(m.group(2), max_s, thresh)
    if s and hlevel(s) == 0 and not s.startswith(('|', '```', '>', '<', '---', '***')) \
            and not re.match(r'^\*(Bảng|Hình)\s', s) and not re.match(r'^\*\*[^*]+:\*\*', s):
        return trim_text(line, max_s, thresh)
    return line


def drop_mode(title, level, chapter):
    """Return 'force', 'safe', or None for a heading."""
    if level == 1:
        if re.match(r'^DANH MỤC BẢNG', title):   # keep DANH MỤC HÌNH (auto ToF)
            return 'force'
        if re.match(r'^NHẬN XÉT CỦA GIẢNG VIÊN PHẢN BIỆN', title):
            return 'force'
        return None
    if level == 2:
        if re.match(r'^3\.6\b', title):   # Đồ thị quan hệ (redundant with 2.3/2.4)
            return 'force'
        if re.match(r'^2\.4\b', title):   # Chuyển ERD sang QH (covered by 2.5 design)
            return 'force'
        return None
    if level == 3:
        if chapter == 4 and any(k in title for k in CH4_DROP):
            return 'force'
        if any(re.match(p, title) for p in FORCE_DROP):
            return 'force'
        m = re.match(r'^3\.([45])\.(\d+)', title)
        if m and m.group(2) != '11':
            return 'safe'
    return None


def main():
    lines = open(SRC, encoding='utf-8').read().split('\n')
    n = len(lines)
    out = []
    i = 0
    chapter = 0
    cur = ''
    cur_sec = ''   # last heading at level <= 3 (for table-drop context)
    while i < n:
        line = lines[i]
        s = line.strip()
        lvl = hlevel(s)

        if lvl >= 1:
            cur = re.sub(r'^#{1,6}\s+', '', s)
            if lvl <= 3:
                cur_sec = cur
            if lvl == 1:
                mc = re.match(r'^#\s+CHƯƠNG\s+(\d+)', s)
                chapter = int(mc.group(1)) if mc else 0
            mode = drop_mode(cur, lvl, chapter)
            if mode:
                j = i + 1
                while j < n:
                    l2 = hlevel(lines[j].strip())
                    if 1 <= l2 <= lvl:
                        break
                    j += 1
                region = '\n'.join(lines[i:j])
                if mode == 'force' or '```mermaid' not in region:
                    i = j
                    continue

        # drop illustrative tables under selected sections
        if s.startswith('|') and any(re.match(p, cur_sec) for p in TABLE_DROP):
            while i < n and lines[i].strip().startswith('|'):
                i += 1
            continue

        # fenced block
        if s.startswith('```'):
            is_mermaid = s.startswith('```mermaid')
            drop_fence = is_mermaid and any(cur.startswith(p) for p in DIAGRAM_DROP_PREFIX)
            block = [line]
            i += 1
            while i < n and not lines[i].strip().startswith('```'):
                block.append(lines[i])
                i += 1
            if i < n:
                block.append(lines[i])
                i += 1
            if not drop_fence:
                out.extend(block)
            continue

        out.append(trim_line(line, chapter))
        i += 1

    text = '\n'.join(out)
    text = re.sub(r'\n{3,}', '\n\n', text)
    open(OUT, 'w', encoding='utf-8').write(text)
    print('condensed lines:', len(out), '/ original', n)
    print('mermaid blocks kept:', text.count('```mermaid'))


if __name__ == '__main__':
    main()
