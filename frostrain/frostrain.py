import os
import shutil
import subprocess
import tkinter as tk
from tkinter import messagebox

FOLDER_A = r"C:\Users\hotpi\AppData\LocalLow\nemonan\Frostrain 2\Profile\SaveData"
FOLDER_B = r"C:\Users\hotpi\Downloads"

FILE_NAME = "save_0.json"

GAME_EXE_PATH = r"C:\Program Files (x86)\Steam\steamapps\common\Frostrain2\Frostrain 2.exe"
GAME_PROCESS_NAME = "Frostrain 2.exe"


def move_file(src_folder, dst_folder):
    src = os.path.join(src_folder, FILE_NAME)
    dst = os.path.join(dst_folder, FILE_NAME)

    if not os.path.exists(src):
        messagebox.showerror("오류", f"파일 없음: {src}")
        return

    shutil.copy2(src, dst)


def on_btn1():
    move_file(FOLDER_A, FOLDER_B)


def on_btn2():
    move_file(FOLDER_B, FOLDER_A)


def kill_game():
    result = subprocess.run(
        ["taskkill", "/F", "/IM", GAME_PROCESS_NAME],
        capture_output=True,
        text=True
    )

    print("stdout:", result.stdout)
    print("stderr:", result.stderr)
    print("code:", result.returncode)

    return result.returncode == 0


def start_game():
    subprocess.Popen([GAME_EXE_PATH])


def on_btn3():
    kill_game()
    start_game()


# ===== UI =====
root = tk.Tk()
root.title("도르마무")
root.geometry("300x150")

tk.Button(root, text="세이브 저장", command=on_btn1, height=2).pack(fill="x", padx=10, pady=5)
tk.Button(root, text="세이브 불러오기", command=on_btn2, height=2).pack(fill="x", padx=10, pady=5)
tk.Button(root, text="게임 재실행", command=on_btn3, height=2).pack(fill="x", padx=10, pady=5)

root.mainloop()
