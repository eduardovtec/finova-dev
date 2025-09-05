import mysql.connector
import pandas as pd

# Configurações do banco
db_config = {
    'host': 'DB_HOST',
    'user': 'DB_USER',
    'password': 'DB_PASS',
    'database': 'DB_NAME',
    'port': 3306
}

query = """
SET @data_atual = 20250905;
SET @data_anterior = DATE_SUB(@data_atual, INTERVAL 1 DAY);

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

# Conectando ao MySQL
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor(dictionary=True)

# Executar múltiplas statements
for result in cursor.execute(query, multi=True):
    pass  # garante que todas as queries SET e WITH sejam processadas

# Executar a query final e obter o resultado
cursor.execute("""
SELECT 
    CAST(@data_atual AS DATE) AS 'Data',
    CAST(ROUND((SELECT COUNT(*) FROM med21)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '21',
    CAST(ROUND((SELECT COUNT(*) FROM med62)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '62',
    CAST(ROUND((SELECT COUNT(*) FROM med125)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '125',
    CAST(ROUND((SELECT COUNT(*) FROM med252)/(SELECT COUNT(*) FROM total), 2)*100 AS SIGNED) AS '252';
""")
rows = cursor.fetchall()
conn.close()

# Salvar em CSV
df = pd.DataFrame(rows)
df.to_csv("data/market-tracker.csv", index=False)
print("CSV gerado com sucesso!")
