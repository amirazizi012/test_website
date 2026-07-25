from graphviz import Digraph


dot = Digraph("UseCaseDiagram", format="png")
dot.attr(rankdir="LR")


dot.node("User", "کاربر", shape="box")
dot.node("Admin", "مدیر سامانه", shape="box")
dot.node("Expert", "مشاور حقوقی", shape="box")


dot.node("UC1", "ثبت نام", shape="ellipse")
dot.node("UC2", "ورود به سیستم", shape="ellipse")
dot.node("UC3", "مدیریت پروفایل", shape="ellipse")
dot.node("UC4", "ثبت پرسش حقوقی", shape="ellipse")
dot.node("UC5", "دریافت پاسخ حقوقی", shape="ellipse")
dot.node("UC6", "جستجوی قوانین", shape="ellipse")
dot.node("UC7", "مشاهده قوانین", shape="ellipse")
dot.node("UC8", "مشاهده سوابق", shape="ellipse")
dot.node("UC9", "یافتن سازمان مسئول", shape="ellipse")
dot.node("UC10", "مشاهده اطلاعات سازمان", shape="ellipse")
dot.node("UC11", "دریافت راهنمای خدمات", shape="ellipse")

dot.node("UC12", "افزودن قوانین", shape="ellipse")
dot.node("UC13", "ویرایش قوانین", shape="ellipse")
dot.node("UC14", "مدیریت پایگاه دانش", shape="ellipse")


dot.node("UC15", "مدیریت کاربران", shape="ellipse")
dot.node("UC16", "مشاهده گزارش ها", shape="ellipse")


for uc in ["UC1","UC2","UC3","UC4","UC5","UC6","UC7",
           "UC8","UC9","UC10","UC11"]:
    dot.edge("User", uc)


for uc in ["UC12","UC13","UC14"]:
    dot.edge("Expert", uc)


for uc in ["UC14","UC15","UC16"]:
    dot.edge("Admin", uc)


dot.edge("UC4", "UC5", label="<<include>>", style="dashed")
dot.edge("UC6", "UC7", label="<<include>>", style="dashed")
dot.edge("UC9", "UC10", label="<<include>>", style="dashed")


dot.render("Legal_Crisis_UseCase_Diagram", view=True)

print("Diagram generated successfully.")