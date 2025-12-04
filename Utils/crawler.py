import requests
import json
from time import sleep
from bs4 import BeautifulSoup

# --- 설정 ---
BASE_URL = "https://www.aladin.co.kr/scm/wpopup_category.aspx/GetCategoryData"

HEADERS = {
    "Content-Type": "application/json; charset=UTF-8",
    "Origin": "https://www.aladin.co.kr",
    "Referer": "https://www.aladin.co.kr/scm/wpopup_category.aspx?cat=0&branchType=1",
    "X-Requested-With": "XMLHttpRequest",
}

# --- 세션 생성 + 쿠키 삽입 ---
session = requests.Session()
session.cookies.update({
    "ASP.NET_SessionId": "pqaideixngrq43o1ffrg02lc",
    "AladdinUser": "UID=-1816635877&SID=OSstlsUmYdWQK3mR%2bz9TuA%3d%3d",
    "AladdinLogin": "6JgoN0hk99PN8namEWj9oQ%3d%3d",
    "AladdinSession": "UID=-1816635877&SID=OSstlsUmYdWQK3mR%2bz9TuA%3d%3d",
    "Supplier": "SupplierId=abina%40naver.com&SupplierCode=551895&SupplierName=%ea%b9%80%eb%af%bc%ec%a0%95&SupplierBranchType=6&SupplierShopCode=551895&ShopType=2",
})

# --- HTML 내 대분류 리스트 ---
HTML_C0 = """<select name="c0" id="c0" class="af1" multiple="">
<option value="55890">건강/취미</option><option value="170">경제경영</option><option value="76001">고등학교참고서</option>
<option value="2105">고전</option><option value="987">과학</option><option value="4395">달력/기타</option>
<option value="8257">대학교재/전문서적</option><option value="2551">만화</option><option value="798">사회과학</option>
<option value="1">소설/시/희곡</option><option value="1383">수험서/자격증</option><option value="1108">어린이</option>
<option value="55889">에세이</option><option value="1196">여행</option><option value="74">역사</option>
<option value="517">예술/대중문화</option><option value="1322">외국어</option><option value="1230">요리/살림</option>
<option value="13789">유아</option><option value="656">인문학</option><option value="336">자기계발</option>
<option value="2913">잡지</option><option value="17195">전집/중고전집</option><option value="1237">종교/역학</option>
<option value="2030">좋은부모</option><option value="76000">중학교참고서</option><option value="1137">청소년</option>
<option value="50246">초등학교참고서</option><option value="351">컴퓨터/모바일</option><option value="116922">고서/희귀본</option>
</select>-->
"""

# 전체 트리
category_tree = []


# --- HTML 파싱으로 대분류 확보 ---
soup = BeautifulSoup(HTML_C0, "html.parser")
for option in soup.find_all("option"):
    cid = int(option["value"])
    name = option.text.strip()
    category_tree.append({
        "name": name,
        "cid": cid,
        "children": []
    })


# --- AJAX 호출 ---
def fetch_category(to, cid):
    payload = {"to": to, "cid": cid, "branchType": 1}
    resp = session.post(BASE_URL, json=payload, headers=HEADERS)
    resp.raise_for_status()
    data = resp.json().get("d", {})
    return data.get("list", []), data.get("isDone", False)


# --- 재귀 수집 ---
def collect_subcategories(node, to=1, path=""):
    cid = node["cid"]
    node_path = f"{path}/{node['name']}" if path else node["name"]

    children_list, isDone = fetch_category(to, cid)

    print(f"[Depth {to}] {node_path} (CID={cid}) → {len(children_list)}개")

    for item in children_list:
        if item["CategoryId"] == -1:
            continue

        child_node = {
            "name": item["Category"],
            "cid": item["CategoryId"],
            "children": []
        }
        node["children"].append(child_node)

        collect_subcategories(child_node, to + 1, node_path)

    sleep(0.1)


# --- 전체 트리 수집 ---
for top_node in category_tree:
    collect_subcategories(top_node, 1)


# --- JSON 저장 (CID 유지!) ---
with open("category_tree_full.json", "w", encoding="utf-8") as f:
    json.dump(category_tree, f, ensure_ascii=False, indent=2)

print("완료 → category_tree_full.json (CID 포함)")
