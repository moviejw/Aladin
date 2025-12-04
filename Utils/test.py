import requests

session = requests.Session()

headers = {
    "Content-Type": "application/json; charset=UTF-8",
    "Origin": "https://www.aladin.co.kr",
    "Referer": "https://www.aladin.co.kr/scm/wpopup_category.aspx?cat=0&branchType=1",
    "X-Requested-With": "XMLHttpRequest"
}

session.cookies.update({
    "ASP.NET_SessionId": "pqaideixngrq43o1ffrg02lc",
    "AladdinUser": "UID=-1816635877&SID=OSstlsUmYdWQK3mR%2bz9TuA%3d%3d",
    "AladdinLogin": "6JgoN0hk99PN8namEWj9oQ%3d%3d",
    "AladdinSession": "UID=-1816635877&SID=OSstlsUmYdWQK3mR%2bz9TuA%3d%3d",
    "Supplier": "SupplierId=abina%40naver.com&SupplierCode=551895&SupplierName=%ea%b9%80%eb%af%bc%ec%a0%95&SupplierBranchType=6&SupplierShopCode=551895&ShopType=2",
})

url = "https://www.aladin.co.kr/scm/wpopup_category.aspx/GetCategoryData"

payload = {"to":1,"cid": "55890", "branchType":1}  # 건강/취미

res = session.post(url, json=payload, headers=headers)
print(res.text[:500])
