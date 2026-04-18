# neo4j_api.py
from flask import Flask, request, jsonify
from py2neo import Graph
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 改成你的 Neo4J 密码
graph = Graph("bolt://host.docker.internal:7687", auth=("neo4j", "lzcalone"))

# 18类问句的Cypher查询模板（使用 $entity 参数）
QUERY_TEMPLATES = {
    "disease_symptom": "MATCH (d:Disease {name: $entity})-[:has_symptom]->(s) RETURN s.name AS name",
    "disease_drug": "MATCH (d:Disease {name: $entity})-[:recommand_drug]->(dr) RETURN dr.name AS name",
    "disease_check": "MATCH (d:Disease {name: $entity})-[:need_check]->(c) RETURN c.name AS name",
    "disease_cause": "MATCH (d:Disease {name: $entity}) RETURN d.cause AS result",
    "disease_prevent": "MATCH (d:Disease {name: $entity}) RETURN d.prevent AS result",
    "disease_cureway": "MATCH (d:Disease {name: $entity}) RETURN d.cure_way AS result",
    "disease_cureprob": "MATCH (d:Disease {name: $entity}) RETURN d.cured_prob AS result",
    "disease_easyget": "MATCH (d:Disease {name: $entity}) RETURN d.easy_get AS result",
    "disease_desc": "MATCH (d:Disease {name: $entity}) RETURN d.desc AS result",
    "disease_acompany": "MATCH (d:Disease {name: $entity})-[:acompany_with]->(a) RETURN a.name AS name",
    "disease_not_food": "MATCH (d:Disease {name: $entity})-[:no_eat]->(f) RETURN f.name AS name",
    "disease_do_food": "MATCH (d:Disease {name: $entity})-[:do_eat]->(f) RETURN f.name AS name",
    "symptom_disease": "MATCH (s:Symptom {name: $entity})<-[:has_symptom]-(d) RETURN d.name AS name",
    "drug_disease": "MATCH (dr:Drug {name: $entity})<-[:recommand_drug]-(d) RETURN d.name AS name",
    "check_disease": "MATCH (c:Check {name: $entity})<-[:need_check]-(d) RETURN d.name AS name",
    "food_not_disease": "MATCH (f:Food {name: $entity})<-[:no_eat]-(d) RETURN d.name AS name",
    "food_do_disease": "MATCH (f:Food {name: $entity})<-[:do_eat]-(d) RETURN d.name AS name",
}


@app.route('/query', methods=['POST'])
def query_neo4j():
    data = request.get_json()
    question_type = data.get('type')
    entity = data.get('entity')

    if not question_type or not entity:
        return jsonify({"error": "缺少参数"}), 400

    if question_type not in QUERY_TEMPLATES:
        return jsonify({"error": f"不支持的问题类型: {question_type}"}), 400

    query = QUERY_TEMPLATES[question_type]

    try:
        results = graph.run(query, parameters={"entity": entity}).data()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # 提取结果
    if results:
        if question_type in ["disease_cause", "disease_prevent", "disease_cureway",
                             "disease_cureprob", "disease_easyget", "disease_desc"]:
            # 属性查询，直接取值
            value = results[0].get('result')
            return jsonify({"results": [value] if value else []})
        else:
            # 关系查询，取节点名
            values = [r['name'] for r in results if r.get('name')]
            return jsonify({"results": list(set(values))})
    else:
        return jsonify({"results": []})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)