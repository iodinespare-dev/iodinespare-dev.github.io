#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
朽木毅行者 · 相片更新工具（一次過處理兩個相片區）
==========================================================
用法：
  1. 把相片放進對應資料夾
       - 訓練實錄 → 「照片」資料夾
       - 支援隊   → 「support team」資料夾
  2. 在終端機執行：  python3 update_photos.py
  3. 重新整理網頁即可

它會自動：
  - 讀取資料夾內所有圖片（任何檔名、任何順序）
  - 產生縮圖 thumb/（500px）與原尺寸圖 full/（最長邊上限 1800px，不會放大）
  - 更新 assets/gallery-photos.js 與 assets/support-photos.js

只需 macOS 內建的 python3 與 sips，不需安裝任何東西。
"""

import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))

# (來源資料夾, 縮圖輸出, 原圖輸出, manifest 檔, 全域變數)
JOBS = [
    ('照片', 'images/gallery/thumb', 'images/gallery/full',
     'assets/gallery-photos.js', 'GALLERY_PHOTOS'),
    ('support team', 'images/support/thumb', 'images/support/full',
     'assets/support-photos.js', 'SUPPORT_PHOTOS'),
]

FULL_MAX_WIDTH = 1800   # 放大時顯示的上限（像素）；原圖細過呢個數就唔會放大
THUMB_WIDTH = 480       # 縮圖闊度（像素）
QUALITY = 82            # 原圖 JPEG 品質 0–100
THUMB_QUALITY = 74      # 縮圖品質（細圖唔使咁高，可以慳流量）

EXTS = ('.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp',
        '.tif', '.tiff', '.gif', '.bmp', '.jp2')


def natural_key(name):
    """讓 IMG2 排在 IMG10 前面"""
    return [int(t) if t.isdigit() else t.lower()
            for t in re.split(r'(\d+)', name)]


def pixel_width(path):
    r = subprocess.run(['sips', '-g', 'pixelWidth', path],
                       capture_output=True, text=True)
    m = re.search(r'pixelWidth:\s*(\d+)', r.stdout)
    return int(m.group(1)) if m else 0


def convert(src, dst, width=None, quality=QUALITY):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    args = ['sips']
    if width:
        args += ['--resampleWidth', str(width)]
    args += ['-s', 'format', 'jpeg', '-s', 'formatOptions', str(quality),
             src, '--out', dst]
    return subprocess.run(args, capture_output=True, text=True).returncode == 0


def run_job(src_dir, thumb_dir, full_dir, manifest, var):
    src_path = os.path.join(ROOT, src_dir)
    print('\n【%s】' % src_dir)

    if not os.path.isdir(src_path):
        print('  找不到資料夾：%s（已略過）' % src_dir)
        write_manifest(os.path.join(ROOT, manifest), var, [])
        return 0

    files = [f for f in os.listdir(src_path)
             if not f.startswith('.') and f.lower().endswith(EXTS)]
    files.sort(key=natural_key)

    if not files:
        print('  資料夾內沒有圖片。')

    # 清掉舊檔，避免殘留已刪除的相片
    for d in (os.path.join(ROOT, full_dir), os.path.join(ROOT, thumb_dir)):
        if os.path.isdir(d):
            shutil.rmtree(d)

    items = []
    for i, name in enumerate(files, 1):
        src = os.path.join(src_path, name)
        n = '%03d' % i
        rel_full = full_dir + '/' + n + '.jpg'
        rel_thumb = thumb_dir + '/' + n + '.jpg'
        dst_full = os.path.join(ROOT, rel_full)
        dst_thumb = os.path.join(ROOT, rel_thumb)

        # 原圖：只縮不放
        w = pixel_width(src)
        ok = convert(src, dst_full, FULL_MAX_WIDTH if w > FULL_MAX_WIDTH else None)
        ok = ok and convert(src, dst_thumb, THUMB_WIDTH, THUMB_QUALITY)

        if ok:
            items.append({'thumb': rel_thumb, 'full': rel_full, 'name': name})
            print('  ✓ %s' % name)
        else:
            print('  ✗ 略過（無法讀取）：%s' % name)

    write_manifest(os.path.join(ROOT, manifest), var, items)
    print('  → %d 張，已更新 %s' % (len(items), manifest))
    return len(items)


def write_manifest(path, var, items):
    lines = ['/* 由 update_photos.py 自動產生，請勿手動修改 */',
             'window.%s = [' % var]
    for it in items:
        lines.append('  {"thumb": "%s", "full": "%s", "name": "%s"},'
                     % (it['thumb'], it['full'], it['name'].replace('"', '')))
    lines.append('];')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')


def main():
    total = 0
    for job in JOBS:
        total += run_job(*job)
    print('\n全部完成：共 %d 張相片' % total)
    print('重新整理網頁即可看到成果。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
