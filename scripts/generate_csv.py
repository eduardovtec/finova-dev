import os
import mysql.connector
import pandas as pd

db_config = {
    'host': os.environ['DB_HOST'],
    'user': os.environ['DB_USER'],
    'password': os.environ['DB_PASS'],
    'database': os.environ['DB_NAME'],
    'port': 3306
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# Executar SETs separadamente
cursor.execute("SET @data_atual = 20250905;")
cursor.execute("SET @data_anterior = DATE_SUB(@data_atual, INTERVAL 1 DAY);")

# Executar query final
query = """
WITH total AS (
    SELECT * FROM b3.cotacoes WHERE data = @data_atual
),
med21 AS (
    SELECT final.*, dia-media_21 diff21 FROM (
        SELECT DATA, codigo, 
               (SELECT preco FROM b3.cotacoes b WHERE b.codigo = a.codigo AND b.data = @data_atual) AS dia, 
               media_21 
        FROM (
            SELECT MAX(DATA) data, codigo, ROUND(AVG(CASE WHEN rn <= 21 THEN preco END), 2) AS media_21
            FROM (
                SELECT codigo, preco, DATA, ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY data DESC) AS rn
                FROM b3.cotacoes WHERE DATA <= @data_anterior
            ) AS subquery
            WHERE rn <= 21
            GROUP BY codigo
        ) AS a
    ) final
    WHERE dia-media_21 > 0
),
med62 AS (
    SELECT final.*, dia-media_62 diff62 FROM (
        SELECT DATA, codigo, 
               (SELECT preco FROM b3.cotacoes b WHERE b.codigo = a.codigo AND b.data = @data_atual) AS dia, 
               media_62 
        FROM (
            SELECT MAX(DATA) data, codigo, ROUND(AVG(CASE WHEN rn <= 62 THEN preco END), 2) AS media_62
            FROM (
                SELECT codigo, preco, DATA, ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY data DESC) AS rn
                FROM b3.cotacoes WHERE DATA <= @data_anterior
            ) AS subquery
            WHERE rn <= 62
            GROUP BY codigo
        ) AS a
    ) final
    WHERE dia-media_62 > 0
),
med125 AS (
    SELECT final.*, dia-media_125 diff125 FROM (
        SELECT DATA, codigo, 
               (SELECT preco FROM b3.cotacoes b WHERE b.codigo = a.codigo AND b.data = @data_atual) AS dia, 
               media_125 
        FROM (
            SELECT MAX(DATA) data, codigo, ROUND(AVG(CASE WHEN rn <= 125 THEN preco END), 2) AS media_125
            FROM (
                SELECT codigo, preco, DATA, ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY data DESC) AS rn
                FROM b3.cotacoes WHERE DATA <= @data_anterior
            ) AS subquery
            WHERE rn <= 125
            GROUP BY codigo
        ) AS a
    ) final
    WHERE dia-media_125 > 0
),
med252 AS (
    SELECT final.*, dia-media_252 diff252 FROM (
        SELECT DATA, codigo, 
               (SELECT preco FROM b3.cotacoes b WHERE b.codigo = a.codigo AND b.data = @data_atual) AS dia, 
               media_252 
        FROM (
            SELECT MAX(DATA) data, codigo, ROUND(AVG(CASE WHEN rn <= 252 THEN preco END), 2) AS media_252
            FROM (
                SELECT codigo, preco, DATA, ROW_NUMBER() OVER (PARTITION BY codigo ORDER BY data DESC) AS rn
                FROM b3.cotacoes WHERE DATA <= @data_anterior
            ) AS subquery
            WHERE rn <= 252
            GROUP BY codigo
        ) AS a
    ) final
    WHERE dia-media_252 > 0
)
SELECT 
    CAST(@data_atual AS DATE) AS 'Data',
    CAST(ROUND((SELECT COUNT(*) FROM med21)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '21',
    CAST(ROUND((SELECT COUNT(*) FROM med62)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '62',
    CAST(ROUND((SELECT COUNT(*) FROM med125)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '125',
    CAST(ROUND((SELECT COUNT(*) FROM med252)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '252';
"""

cursor.execute(query)
rows = cursor.fetchall()
conn.close()

# Salvar CSV
df = pd.DataFrame(rows)
df.to_csv("data/market-tracker.csv", index=False)
print("CSV gerado com sucesso!")
