# export_to_markdown.py
from py2neo import Graph
import json

graph = Graph("bolt://localhost:7687", auth=("neo4j", "lzcalone"))

# 查询前200种常见疾病的核心信息
query = """
MATCH (d:Disease)
RETURN d.name as name, 
       d.desc as desc, 
       d.cause as cause, 
       d.prevent as prevent, 
       d.cure_way as cure_way, 
       d.cured_prob as cured_prob, 
       d.easy_get as easy_get
LIMIT 200
"""

results = graph.run(query).data()

# 生成Markdown格式
with open("medical_knowledge.md", "w", encoding="utf-8") as f:
    for disease in results:
        f.write(f"# {disease['name']}\n")
        if disease['desc']:
            f.write(f"- 疾病描述：{disease['desc']}\n")
        if disease['cause']:
            f.write(f"- 病因：{disease['cause']}\n")
        if disease['prevent']:
            f.write(f"- 预防措施：{disease['prevent']}\n")
        if disease['cure_way']:
            f.write(f"- 治疗方式：{disease['cure_way']}\n")
        if disease['cured_prob']:
            f.write(f"- 治愈概率：{disease['cured_prob']}\n")
        if disease['easy_get']:
            f.write(f"- 易感人群：{disease['easy_get']}\n")
        f.write("\n")